<?php
function get_statistics_handler(): void {
    require_auth();
    $db = get_db();

    $category = $_GET['category'] ?? 'Historical';
    $valid    = ['Historical', 'Active', 'Inactive', 'Honorary', 'All'];
    if (!in_array($category, $valid, true)) $category = 'Historical';
    // Public users can only see Historical statistics
    if (($_SESSION['user_role'] ?? '') === 'public') $category = 'Historical';

    $cat_join  = 'LEFT JOIN MemberCategory mc ON m.MemberCategoryID = mc.CategoryID';
    $cat_where = $category !== 'All' ? "AND mc.CategoryName = '$category'" : '';

    try {
        // Last name counts
        $rows = $db->query("
            SELECT m.LastName, COUNT(*) AS cnt
            FROM Members m $cat_join
            WHERE m.LastName IS NOT NULL AND TRIM(m.LastName) != '' $cat_where
            GROUP BY m.LastName
            ORDER BY cnt DESC, m.LastName
            LIMIT 200
        ")->fetchAll();
        $last_names = array_map(fn($r) => ['name' => $r[0], 'count' => (int)$r[1]], $rows);
    } catch (Exception $e) {
        json_out(['error' => 'surnames query failed: ' . $e->getMessage()], 500);
    }

    try {
        // Oldest members (top 10 by DOB)
        $rows = $db->query("
            SELECT m.MemberID, m.FirstName, m.LastName, m.`Date of Birth`, mc.CategoryName
            FROM Members m $cat_join
            WHERE m.`Date of Birth` IS NOT NULL AND m.`Date of Birth` != '0000-00-00' $cat_where
            ORDER BY m.`Date of Birth` ASC
            LIMIT 10
        ")->fetchAll();
        $oldest = array_map(fn($r) => [
            'id'          => (int)$r[0],
            'name'        => trim($r[1] . ' ' . $r[2]),
            'dateOfBirth' => format_date($r[3]),
            'category'    => $r[4] ?? '',
        ], $rows);
    } catch (Exception $e) {
        json_out(['error' => 'oldest members query failed: ' . $e->getMessage()], 500);
    }

    try {
        // Irish county connections (filtered by category)
        $rows = $db->query("
            SELECT ic.CountyName, COUNT(DISTINCT icc.MemberID) AS cnt
            FROM IrishConnectionByCounty icc
            LEFT JOIN IrishCounties ic ON icc.CountyID = ic.CountyID
            LEFT JOIN Members m ON icc.MemberID = m.MemberID
            LEFT JOIN MemberCategory mc ON m.MemberCategoryID = mc.CategoryID
            WHERE ic.CountyName IS NOT NULL $cat_where
            GROUP BY ic.CountyName
            ORDER BY cnt DESC
        ")->fetchAll();
        $irish_counties = array_map(fn($r) => ['county' => $r[0], 'count' => (int)$r[1]], $rows);
    } catch (Exception $e) {
        json_out(['error' => 'irish counties query failed: ' . $e->getMessage()], 500);
    }

    try {
        // Places of birth
        $rows = $db->query("
            SELECT m.`Place of Birth`, COUNT(*) AS cnt
            FROM Members m $cat_join
            WHERE m.`Place of Birth` IS NOT NULL AND TRIM(m.`Place of Birth`) != '' $cat_where
            GROUP BY m.`Place of Birth`
            ORDER BY cnt DESC
            LIMIT 100
        ")->fetchAll();
        $places = array_map(fn($r) => ['place' => $r[0], 'count' => (int)$r[1]], $rows);
    } catch (Exception $e) {
        json_out(['error' => 'places of birth query failed: ' . $e->getMessage()], 500);
    }

    json_out([
        'category'      => $category,
        'lastNames'     => $last_names,
        'oldestMembers' => $oldest,
        'irishCounties' => $irish_counties,
        'placesOfBirth' => $places,
    ]);
}
