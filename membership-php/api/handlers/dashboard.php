<?php
function public_dashboard_handler(): void {
    $db = get_db();

    $total  = (int)$db->query("
        SELECT COUNT(*) FROM Members m
        INNER JOIN MemberCategory mc ON m.MemberCategoryID = mc.CategoryID
        WHERE mc.CategoryName = 'Historical'
    ")->fetchColumn();
    $active = (int)$db->query("
        SELECT COUNT(*) FROM Members m
        INNER JOIN MemberCategory mc ON m.MemberCategoryID = mc.CategoryID
        WHERE mc.CategoryName = 'Active'
    ")->fetchColumn();

    // Categories for pie chart
    $cat_rows = $db->query("
        SELECT mc.CategoryName, COUNT(m.MemberID) AS cnt
        FROM MemberCategory mc
        LEFT JOIN Members m ON mc.CategoryID = m.MemberCategoryID
        GROUP BY mc.CategoryName
        HAVING cnt > 0
        ORDER BY cnt DESC
    ")->fetchAll();
    $categories = array_map(fn($r) => ['name' => $r[0], 'value' => (int)$r[1]], $cat_rows);

    // Regions for bar chart (top 10 provinces by member count)
    $region_rows = $db->query("
        SELECT COALESCE(p.ProvinceName, ma.ProvinceID, 'Unknown') AS prov, COUNT(DISTINCT ma.MemberID) AS cnt
        FROM MemberAddress ma
        LEFT JOIN Provinces p ON CAST(ma.ProvinceID AS UNSIGNED) = p.ProvinceID
        WHERE ma.IsCurrent = 1
        GROUP BY prov
        ORDER BY cnt DESC
        LIMIT 10
    ")->fetchAll();
    $regions = array_map(fn($r) => ['name' => $r[0], 'value' => (int)$r[1]], $region_rows);

    // Historical highlights
    $first = $db->query("SELECT MIN(DateJoined) FROM Members WHERE DateJoined IS NOT NULL AND DateJoined != '0000-00-00'")->fetchColumn();

    $best = $db->query("
        SELECT YEAR(DateJoined) AS yr, COUNT(*) AS cnt
        FROM Members
        WHERE DateJoined IS NOT NULL AND DateJoined != '0000-00-00'
        GROUP BY yr ORDER BY cnt DESC LIMIT 1
    ")->fetch();
    $most_in_year = $best ? $best[1] . ' members in ' . $best[0] : '-';

    $lifetime = (int)$db->query("
        SELECT COUNT(*) FROM Members m
        INNER JOIN MemberCategory mc ON m.MemberCategoryID = mc.CategoryID
        WHERE mc.CategoryName = 'Honorary'
    ")->fetchColumn();

    json_out([
        'totalMembers' => $total,
        'totalActive'  => $active,
        'categories'   => $categories,
        'regions'      => $regions,
        'historical'   => [
            'firstRegistered' => $first ?: null,
            'mostInAYear'     => $most_in_year,
            'lifetime'        => $lifetime,
        ],
    ]);
}

function dashboard_stats_handler(): void {
    require_private_or_admin();
    $db = get_db();

    $start      = $_GET['startDate'] ?? null;
    $end        = $_GET['endDate']   ?? null;
    $cat_filter = $_GET['category']  ?? null;

    // Date clauses reused across queries
    $date_where  = [];
    $date_params = [];
    if ($start) { $date_where[] = 'm.DateJoined >= ?'; $date_params[] = $start; }
    if ($end)   { $date_where[] = 'm.DateJoined <= ?'; $date_params[] = $end; }

    // Total with optional date + category filter
    $total_where  = $date_where;
    $total_params = $date_params;
    $cat_join = '';
    if ($cat_filter) {
        $cat_join = 'LEFT JOIN MemberCategory mc ON m.MemberCategoryID = mc.CategoryID';
        $total_where[]  = 'mc.CategoryName = ?';
        $total_params[] = $cat_filter;
    }
    $total_where_sql = $total_where ? 'WHERE ' . implode(' AND ', $total_where) : '';
    $s = $db->prepare("SELECT COUNT(*) FROM Members m $cat_join $total_where_sql");
    $s->execute($total_params);
    $total = (int)$s->fetchColumn();

    // Breakdown by category (with date filter applied)
    $cats      = ['Active' => 'active', 'Inactive' => 'inactive', 'Honorary' => 'honorary', 'Historical' => 'historical'];
    $breakdown = [];
    foreach ($cats as $cat_name => $key) {
        if ($cat_filter && $cat_filter !== $cat_name) { $breakdown[$key] = 0; continue; }
        $cat_where  = array_merge($date_where, ['mc2.CategoryName = ?']);
        $cat_params = array_merge($date_params, [$cat_name]);
        $where_sql  = 'WHERE ' . implode(' AND ', $cat_where);
        $s = $db->prepare("SELECT COUNT(*) FROM Members m LEFT JOIN MemberCategory mc2 ON m.MemberCategoryID = mc2.CategoryID $where_sql");
        $s->execute($cat_params);
        $breakdown[$key] = (int)$s->fetchColumn();
    }

    // Growth: this year vs last year
    $this_year = (int)date('Y');
    $last_year = $this_year - 1;
    $s = $db->prepare('SELECT COUNT(*) FROM Members WHERE YEAR(DateJoined) = ?');
    $s->execute([$this_year]);
    $this_yr_count = (int)$s->fetchColumn();
    $s->execute([$last_year]);
    $last_yr_count = (int)$s->fetchColumn();
    $growth = $last_yr_count > 0 ? round(($this_yr_count - $last_yr_count) / $last_yr_count * 100, 1) : 0;

    // Yearly member counts — apply same date + category filters
    $y_join   = $cat_filter ? 'LEFT JOIN MemberCategory ymc ON m.MemberCategoryID = ymc.CategoryID' : '';
    $y_where  = array_merge(['m.DateJoined IS NOT NULL'], $date_where);
    $y_params = $date_params;
    if ($cat_filter) { $y_where[] = 'ymc.CategoryName = ?'; $y_params[] = $cat_filter; }
    $y_where_sql = 'WHERE ' . implode(' AND ', $y_where);
    $s = $db->prepare("SELECT YEAR(m.DateJoined), COUNT(*) FROM Members m $y_join $y_where_sql GROUP BY YEAR(m.DateJoined) ORDER BY YEAR(m.DateJoined)");
    $s->execute($y_params);
    $yearly = [];
    foreach ($s->fetchAll() as $r) {
        if ($r[0]) $yearly[(string)$r[0]] = (int)$r[1];
    }

    json_out([
        'total'     => $total,
        'growth'    => $growth,
        'breakdown' => $breakdown,
        'yearly'    => $yearly,
    ]);
}

function dashboard_handler(): void {
    require_private_or_admin();
    $db = get_db();

    $active     = (int)$db->query("SELECT COUNT(*) FROM Members m INNER JOIN MemberCategory mc ON m.MemberCategoryID = mc.CategoryID WHERE mc.CategoryName = 'Active'")->fetchColumn();
    $inactive   = (int)$db->query("SELECT COUNT(*) FROM Members m INNER JOIN MemberCategory mc ON m.MemberCategoryID = mc.CategoryID WHERE mc.CategoryName = 'Inactive'")->fetchColumn();
    $historical = (int)$db->query("SELECT COUNT(*) FROM Members m INNER JOIN MemberCategory mc ON m.MemberCategoryID = mc.CategoryID WHERE mc.CategoryName = 'Historical'")->fetchColumn();
    $honorary   = (int)$db->query("SELECT COUNT(*) FROM Members m INNER JOIN MemberCategory mc ON m.MemberCategoryID = mc.CategoryID WHERE mc.CategoryName = 'Honorary'")->fetchColumn();

    $total_soc = 0;
    try { $total_soc = (int)$db->query('SELECT COUNT(*) FROM Society')->fetchColumn(); } catch(Exception $e) {}

    $active_users    = (int)$db->query("SELECT COUNT(*) FROM User WHERE IsApproved = 1")->fetchColumn();
    $pending_approvals = (int)$db->query("SELECT COUNT(*) FROM User WHERE IsApproved = 0")->fetchColumn();

    $thirty_ago = date('Y-m-d', strtotime('-30 days'));
    $s = $db->prepare('SELECT COUNT(*) FROM Members WHERE DateJoined >= ?');
    $s->execute([$thirty_ago]);
    $recent = (int)$s->fetchColumn();

    // Members by category
    $cats = $db->query('SELECT mc.CategoryName, COUNT(m.MemberID) as cnt FROM MemberCategory mc LEFT JOIN Members m ON mc.CategoryID = m.MemberCategoryID GROUP BY mc.CategoryName ORDER BY cnt DESC')->fetchAll();
    $by_cat = array_map(fn($r) => ['name' => $r[0], 'count' => (int)$r[1]], $cats);

    // Members by province
    $provs = $db->query('SELECT p.ProvinceName, p.CountryName, p.CountryCode, COUNT(DISTINCT m.MemberID) as cnt FROM MemberAddress ma JOIN Members m ON ma.MemberID = m.MemberID JOIN Provinces p ON CAST(ma.ProvinceID AS UNSIGNED) = p.ProvinceID WHERE ma.IsCurrent = 1 AND m.IsActive = 1 GROUP BY p.ProvinceName, p.CountryName, p.CountryCode ORDER BY cnt DESC')->fetchAll();
    $by_prov = array_map(fn($r) => ['province' => $r[0], 'country' => $r[1], 'countryCode' => $r[2], 'count' => (int)$r[3]], $provs);

    // Recent activity
    $recent_stmt = $db->query('SELECT CONCAT(m.FirstName, \' \', m.LastName), m.DateJoined, m.MemberID FROM Members m WHERE m.DateJoined IS NOT NULL ORDER BY m.DateJoined DESC LIMIT 10');
    $activity = [];
    foreach ($recent_stmt->fetchAll() as $r) {
        $activity[] = ['name' => $r[0], 'date' => format_date($r[1]), 'activity' => 'New Member', 'id' => $r[2]];
    }

    json_out([
        'stats' => [
            'activeMembers'    => $active,
            'honoraryMembers'  => $honorary,
            'inactiveMembers'  => $inactive + $historical,
            'totalSocieties'   => $total_soc,
            'activeUsers'      => $active_users,
            'recentMembers'    => $recent,
            'pendingApprovals' => $pending_approvals,
        ],
        'charts' => [
            'membersByCategory' => $by_cat,
            'membersByProvince' => $by_prov,
            'membershipGrowth'  => [],
        ],
        'recentActivities' => $activity,
    ]);
}
