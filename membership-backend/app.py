import re
import json
from flask import request, jsonify
from fpdf import FPDF
from flask import Response
import io
from datetime import datetime
from flask import jsonify, session
from flask import Flask, request, jsonify, session, send_file, Response, send_from_directory
from flask_cors import CORS
import pyodbc
import hashlib
from datetime import datetime, timedelta
from functools import wraps
import os
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import base64
from werkzeug.utils import secure_filename
import uuid
import csv
from io import StringIO, BytesIO
import json
try:
    from PIL import Image
except ImportError:
    Image = None
try:
    import pandas as pd
except ImportError:
    pd = None
try:
    from reportlab.lib.pagesizes import letter as reportlab_letter
    from reportlab.pdfgen import canvas as reportlab_canvas
except ImportError:
    reportlab_letter = None  # type: ignore[assignment]
    reportlab_canvas = None  # type: ignore[assignment]
import zipfile
import logging
try:
    from werkzeug.security import check_password_hash
except ImportError:
    def check_password_hash(pwhash: str, password: str) -> bool:
        return pwhash == hashlib.sha256(password.encode()).hexdigest()

import secrets

# Configuration/constants
DATABASE_PATH = r'C:\Users\User\Documents\BISMembershipDatabase.accdb'
CONNECTION_STRING = f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={DATABASE_PATH};'
UPLOAD_FOLDER = 'uploads'
PHOTO_FOLDER = 'uploads/photos'
DOCUMENT_FOLDER = 'uploads/documents'
EXPORT_FOLDER = 'exports'
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB max file size
ALLOWED_EXTENSIONS = {
    'png', 'jpg', 'jpeg', 'gif', 'pdf', 'doc', 'docx', 'txt', 'csv', 'xlsx'
}
PHOTO_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
DOCUMENT_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt', 'csv', 'xlsx'}
SESSION_TIMEOUT = 1800  # 30 minutes
EMAIL_CONFIG = {
    'smtp_server': 'smtp.gmail.com',
    'smtp_port': 587,
    'email': 'your-email@gmail.com',
    'password': 'your-app-password'
}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PHOTO_FOLDER, exist_ok=True)
os.makedirs(DOCUMENT_FOLDER, exist_ok=True)
os.makedirs(EXPORT_FOLDER, exist_ok=True)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import get_db_connection from db_config
from db_config import get_db_connection

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-this'
# Configure session to be persistent
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)  # 24 hour sessions
CORS(app, supports_credentials=True, origins=['http://localhost:3000', 'http://localhost:5173'])

# Helper Functions
def check_session_timeout():
    """Check if session has timed out"""
    if 'last_activity' in session:
        if datetime.now().timestamp() - \
                session['last_activity'] > SESSION_TIMEOUT:
            session.clear()
            return True
    session['last_activity'] = datetime.now().timestamp()
    return False

# Authentication Decorators
def auth_required(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if check_session_timeout():
            return jsonify({'error': 'Session expired'}), 401
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    """Decorator to require admin role"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if check_session_timeout():
            return jsonify({'error': 'Session expired'}), 401
        if 'user_role' not in session or session['user_role'].lower() != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

def private_or_admin_required(f):
    """Decorator to require private or admin role"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if check_session_timeout():
            return jsonify({'error': 'Session expired'}), 401
        if 'user_role' not in session or session['user_role'].lower() not in [
                'admin', 'private']:
            return jsonify({'error': 'Private or Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

@app.route('/api/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'BIS Membership Backend is running',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/dashboard-stats', methods=['GET'])
def dashboard_stats():
    """Get dashboard statistics for the private dashboard"""
    try:
        conn = pyodbc.connect(f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={DATABASE_PATH}')
        cursor = conn.cursor()
        
        # Get total members count
        cursor.execute("SELECT COUNT(*) FROM [Members]")
        total_members = cursor.fetchone()[0]
        
        # Get active members 
        cursor.execute("SELECT COUNT(*) FROM [Members] WHERE IsActive = True")
        active_members = cursor.fetchone()[0]
        
        # Get new members this month
        cursor.execute("SELECT COUNT(*) FROM [Members] WHERE DateJoined >= ?", (datetime.now().replace(day=1).strftime('%Y-%m-%d'),))
        new_this_month = cursor.fetchone()[0]
        
        conn.close()
        
        return jsonify({
            'totalMembers': total_members,
            'activeMembers': active_members,
            'newThisMonth': new_this_month
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/support/contact', methods=['POST'])
@private_or_admin_required
def submit_support_request():
    """Submit a support request"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid input data'}), 400
        
        subject = data.get('subject', '').strip()
        message = data.get('message', '').strip()
        priority = data.get('priority', 'normal')
        
        if not subject or not message:
            return jsonify({'error': 'Subject and message are required'}), 400
        
        user_id = session.get('user_id')
        
        # For now, just log the support request
        # In a real system, you'd store this in a database and/or send an email
        logger.info(f"Support request from user {user_id}: {subject} - {priority}")
        
        return jsonify({
            'success': True,
            'message': 'Support request submitted successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def generate_user_id():
    return "USR" + secrets.token_hex(3).upper()


def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(hashed_password: str, plain_password: str) -> bool:
    return check_password_hash(hashed_password, plain_password)


def generate_reset_token():
    """Generate a secure reset token"""
    return secrets.token_urlsafe(32)


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit(
        '.', 1)[1].lower() in ALLOWED_EXTENSIONS


def is_photo_file(filename):
    """Check if file is a photo"""
    return '.' in filename and filename.rsplit(
        '.', 1)[1].lower() in PHOTO_EXTENSIONS


def is_document_file(filename):
    """Check if file is a document"""
    return '.' in filename and filename.rsplit(
        '.', 1)[1].lower() in DOCUMENT_EXTENSIONS


def send_email(to_email, subject, body):
    """Send email notification"""
    try:
        msg = MIMEMultipart()
        msg['From'] = EMAIL_CONFIG['email']
        msg['To'] = to_email
        msg['Subject'] = subject

        msg.attach(MIMEText(body, 'html'))

        server = smtplib.SMTP(
            EMAIL_CONFIG['smtp_server'],
            EMAIL_CONFIG['smtp_port'])
        server.starttls()
        server.login(EMAIL_CONFIG['email'], EMAIL_CONFIG['password'])
        server.send_message(msg)
        server.quit()

        return True
    except Exception as e:
        logger.error(f"Email sending failed: {e}")
        return False


def log_audit_event(user_id, action, table_name, record_id, details=None):
    """Log audit events"""
    conn = get_db_connection()
    if not conn:
        return

    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO AuditLog (UserID, Action, TableName, RecordID, Details, Timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (user_id, action, table_name, record_id, details or '', datetime.now()))
        conn.commit()
    except Exception as e:
        logger.error(f"Audit logging failed: {e}")
    finally:
        conn.close()


@app.route('/api/me/change-password', methods=['PUT'])
@auth_required
def change_password_me():
    """Authenticated user changes their own password"""
    data = request.get_json()
    old_password = data.get('currentPassword') or data.get('oldPassword')  # Accept both for compatibility
    new_password = data.get('newPassword')

    if not old_password or not new_password:
        return jsonify(
            {'error': 'Both current and new passwords are required'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()

        # Verify old password
        cursor.execute(
            "SELECT PasswordHash, Username FROM [User] WHERE UserID = ?",
            (session['user_id'],
             ))
        row = cursor.fetchone()
        if not row or hash_password(old_password) != row[0]:
            return jsonify({'error': 'Incorrect old password'}), 401

        # Update new password
        hashed = hash_password(new_password)
        cursor.execute("""
            UPDATE [User]
            SET PasswordHash = ?
            WHERE UserID = ?
        """, (hashed, session['user_id']))
        conn.commit()

        # Audit
        log_audit_event(
            session['user_id'],
            'CHANGE_PASSWORD',
            'User',
            session['user_id'],
            f'User {row[1]} changed their password.')

        return jsonify({'success': True, 'message': 'Password updated'})
    except Exception as e:
        return jsonify({'error': f'Failed to update password: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/my-data/export', methods=['GET'])
@auth_required
def export_my_data():
    """Export user's personal data as PDF"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()
        
        # Get user profile information
        cursor.execute("SELECT Username, Email, FirstName, [Last Name], Role, IsApproved, CreatedAt, LastLogin FROM [User] WHERE UserID = ?", (session['user_id'],))
        
        user_info = cursor.fetchone()
        if not user_info:
            return jsonify({'error': 'User not found'}), 404

        # Get audit logs for this user if AuditLog table exists
        activity_history = []
        try:
            cursor.execute("SELECT Action, TargetType, Timestamp, Details FROM [AuditLog] WHERE UserID = ? ORDER BY Timestamp DESC LIMIT 10", (session['user_id'],))
            audit_logs = cursor.fetchall()
            if audit_logs:
                for log in audit_logs:
                    activity_history.append({
                        'action': log[0],
                        'targetType': log[1],
                        'timestamp': log[2].isoformat() if log[2] else None,
                        'details': log[3]
                    })
        except Exception as e:
            # AuditLog table doesn't exist - this is normal for many setups
            activity_history = []

        # Generate PDF
        try:
            pdf = FPDF()
            pdf.add_page()
            
            # Header
            pdf.set_font("Arial", 'B', 18)
            pdf.cell(200, 15, "Personal Data Export", ln=True, align='C')
            pdf.ln(5)
            
            # Export info
            pdf.set_font("Arial", size=10)
            pdf.cell(200, 8, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", ln=True, align='C')
            pdf.cell(200, 8, f"User ID: {session['user_id']}", ln=True, align='C')
            pdf.ln(10)
            
            # Profile Information
            pdf.set_font("Arial", 'B', 14)
            pdf.cell(200, 10, "Profile Information", ln=True, align='L')
            pdf.ln(5)
            
            pdf.set_font("Arial", size=11)
            profile_data = [
                ("Username", user_info[0] or 'N/A'),
                ("Email", user_info[1] or 'N/A'),
                ("First Name", user_info[2] or 'N/A'),
                ("Last Name", user_info[3] or 'N/A'),
                ("Account Role", user_info[4] or 'N/A'),
                ("Account Status", "Approved" if user_info[5] else "Pending Approval"),
                ("Account Created", user_info[6].strftime('%Y-%m-%d %H:%M') if user_info[6] else 'N/A'),
                ("Last Login", user_info[7].strftime('%Y-%m-%d %H:%M') if user_info[7] else 'Never')
            ]
            
            for label, value in profile_data:
                pdf.set_font("Arial", 'B', 10)
                pdf.cell(60, 8, f"{label}:", ln=False, align='L')
                pdf.set_font("Arial", size=10)
                pdf.cell(140, 8, str(value), ln=True, align='L')
            
            pdf.ln(10)
            
            # Activity History
            pdf.set_font("Arial", 'B', 14)
            pdf.cell(200, 10, "Recent Activity History", ln=True, align='L')
            pdf.ln(5)
            
            if activity_history:
                pdf.set_font("Arial", size=9)
                for i, activity in enumerate(activity_history[:10], 1):
                    timestamp = activity.get('timestamp', 'Unknown')
                    if timestamp and timestamp != 'Unknown':
                        try:
                            timestamp = datetime.fromisoformat(timestamp.replace('Z', '')).strftime('%Y-%m-%d %H:%M')
                        except:
                            pass
                    
                    pdf.set_font("Arial", 'B', 9)
                    pdf.cell(200, 6, f"{i}. {activity.get('action', 'Unknown')} - {timestamp}", ln=True, align='L')
                    pdf.set_font("Arial", size=8)
                    pdf.cell(200, 5, f"   Target: {activity.get('targetType', 'N/A')}", ln=True, align='L')
                    if activity.get('details'):
                        pdf.cell(200, 5, f"   Details: {activity.get('details', '')[:80]}...", ln=True, align='L')
                    pdf.ln(2)
            else:
                pdf.set_font("Arial", size=10)
                pdf.cell(200, 8, "No recent activity found.", ln=True, align='L')
            
            pdf.ln(10)
            
            # Data Privacy Notice
            pdf.set_font("Arial", 'B', 12)
            pdf.cell(200, 8, "Data Privacy Notice", ln=True, align='L')
            pdf.ln(3)
            
            pdf.set_font("Arial", size=9)
            privacy_text = [
                "This export contains all personal data we have on file for your account.",
                "This data is provided in accordance with your privacy rights.",
                "If you have questions about your data, please contact our support team.",
                "",
                "Note: Recognitions and membership details are maintained at the society level",
                "and are not included in personal user data exports."
            ]
            
            for line in privacy_text:
                pdf.cell(200, 5, line, ln=True, align='L')
            
            # Generate PDF output
            pdf_output = pdf.output(dest='S').encode('latin1')
            
            response = Response(
                pdf_output,
                mimetype='application/pdf',
                headers={
                    'Content-Disposition': f'attachment; filename=my-personal-data-{datetime.now().strftime("%Y%m%d")}.pdf',
                    'Content-Type': 'application/pdf'
                }
            )
            return response
            
        except Exception as pdf_error:
            return jsonify({'error': f'PDF generation failed: {str(pdf_error)}'}), 500
            
    except Exception as e:
        return jsonify({'error': f'Failed to export data: {str(e)}'}), 500
    finally:
        conn.close()


# Authentication Routes


def create_test_user(username, password, role, email=None):
    """Create a test user for development"""
    conn = get_db_connection()
    if not conn:
        return False

    try:
        cursor = conn.cursor()

        # Check if user already exists
        cursor.execute("SELECT UserID FROM [User] WHERE Username = ?", (username,))
        if cursor.fetchone():
            return True  # User already exists

        # Create the user
        user_id = generate_user_id()
        hashed_password = hash_password(password)

        cursor.execute("""
            INSERT INTO [User] (UserID, Username, Email, PasswordHash, Role, IsApproved, CreatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (user_id, username, email, hashed_password, role, True, datetime.now()))

        conn.commit()
        logger.info(f"Created test user: {username} with role: {role}")
        return True

    except Exception as e:
        logger.error(f"Failed to create test user {username}: {e}")
        return False
    finally:
        conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    """User login endpoint"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400

    # Auto-create test users for development
    if username in ['admin', 'private', 'public']:
        test_passwords = {
            'admin': 'admin123',
            'private': 'private123',
            'public': 'public123'
        }
        if password == test_passwords.get(username):
            role_map = {
                'admin': 'Admin',
                'private': 'Private',
                'public': 'Public'
            }
            create_test_user(username, password, role_map[username], f"{username}@test.com")

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()
        hashed_password = hash_password(password)
        
        logger.info(f"Login attempt - username: {username}")
        
        cursor.execute("""
            SELECT UserID, Username, Email, Role, IsApproved, FirstName, [Last Name]
            FROM [User]
            WHERE (Username = ? OR Email = ?) AND PasswordHash = ? AND IsApproved = True
        """, (username, username, hashed_password))

        user = cursor.fetchone()

        if user:
            logger.info(f"User {user[1]} logged in successfully")
            # Update last login
            cursor.execute("""
                UPDATE [User]
                SET LastLogin = ?
                WHERE UserID = ?
            """, (datetime.now(), user[0]))
            conn.commit()

            # Set session
            session['user_id'] = user[0]
            session['username'] = user[1]
            session['email'] = user[2]
            session['user_role'] = user[3]
            session['last_activity'] = datetime.now().timestamp()
            session.permanent = True  # Make session permanent

            # Log audit event
            log_audit_event(
                user[0],
                'LOGIN',
                'User',
                user[0],
                f'User {username} logged in')

            return jsonify({
                'success': True,
                'user': {
                    'id': user[0],
                    'username': user[1],
                    'email': user[2],
                    'role': user[3],
                    'firstName': user[5],
                    'lastName': user[6]
                }
            })
        else:
            return jsonify({'error': 'Invalid credentials'}), 401

    except Exception as e:
        print("Login error:", e) # Debugging
        return jsonify({'error': f'Login failed: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/logout', methods=['POST'])
def logout():
    """User logout endpoint"""
    if 'user_id' in session:
        log_audit_event(
            session['user_id'],
            'LOGOUT',
            'User',
            session['user_id'],
            f'User {session.get("username")} logged out')
    session.clear()
    return jsonify({'success': True})


@app.route('/api/check-auth', methods=['GET'])
def check_auth():
    """Check if user is authenticated"""
    if check_session_timeout():
        return jsonify({'authenticated': False, 'message': 'Session expired'})

    if 'user_id' in session:
        # Get full user data from database
        conn = get_db_connection()
        if conn:
            try:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT FirstName, [Last Name], Username, Email, Role
                    FROM [User]
                    WHERE UserID = ?
                """, (session['user_id'],))
                
                user_data = cursor.fetchone()
                if user_data:
                    return jsonify({
                        'authenticated': True,
                        'user': {
                            'id': session['user_id'],
                            'firstName': user_data[0],
                            'lastName': user_data[1], 
                            'username': user_data[2] or session.get('username'),
                            'email': user_data[3] or session.get('email'),
                            'role': user_data[4] or session.get('user_role')
                        }
                    })
                else:
                    logger.error(f"Check-auth: No user found for UserID: {session['user_id']}")
            except Exception as e:
                logger.error(f"Error fetching user data: {e}")
            finally:
                conn.close()
        
        # Fallback to session data if database query fails
        return jsonify({
            'authenticated': True,
            'user': {
                'id': session['user_id'],
                'firstName': None,
                'lastName': None,
                'username': session.get('username'),
                'email': session.get('email'),
                'role': session.get('user_role')
            }
        })
    return jsonify({'authenticated': False})

# Enhanced Dashboard Routes


@app.route('/api/dashboard', methods=['GET'])
@private_or_admin_required
def get_dashboard():
    """Get comprehensive dashboard data"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()

        # Basic stats
        cursor.execute("SELECT COUNT(*) FROM Members WHERE IsActive = True")
        row = cursor.fetchone()
        active_members = row[0] if row is not None else 0

        cursor.execute("SELECT COUNT(*) FROM Members WHERE IsActive = False")
        row = cursor.fetchone()
        inactive_members = row[0] if row is not None else 0

        cursor.execute("SELECT COUNT(*) FROM Society")
        row = cursor.fetchone()
        total_societies = row[0] if row is not None else 0

        cursor.execute("SELECT COUNT(*) FROM [User] WHERE IsApproved = True")
        row = cursor.fetchone()
        active_users = row[0] if row is not None else 0

        # Recent members (last 30 days)
        cursor.execute("""
            SELECT COUNT(*) FROM Members
            WHERE DateJoined >= ? AND DateJoined <= ?
        """, (datetime.now() - timedelta(days=30), datetime.now()))
        row = cursor.fetchone()
        recent_members = row[0] if row is not None else 0

        # Pending approvals
        cursor.execute("SELECT COUNT(*) FROM [User] WHERE IsApproved = False")
        row = cursor.fetchone()
        pending_approvals = row[0] if row is not None else 0

        # Members by category
        cursor.execute("""
            SELECT mc.CategoryName, COUNT(m.MemberID) as Count
            FROM MemberCategory mc
            LEFT JOIN Members m ON mc.CategoryID = m.MemberCategoryID
            WHERE m.IsActive = True
            GROUP BY mc.CategoryName
            ORDER BY Count DESC
        """)
        categories = [{'name': row[0], 'count': row[1]}
                      for row in cursor.fetchall()]

        # Members by county (top 10)
        cursor.execute("""
            SELECT TOP 10 ic.CountyName, COUNT(m.MemberID) as Count
            FROM IrishCounties ic
            LEFT JOIN Members m ON ic.CountyID = m.CountyID
            WHERE m.IsActive = True
            GROUP BY ic.CountyName
            ORDER BY Count DESC
        """)
        counties = [{'name': row[0], 'count': row[1]}
                    for row in cursor.fetchall()]

        # Membership growth over time (last 12 months)
        cursor.execute("""
            SELECT
                FORMAT(m.DateJoined, 'yyyy-MM') as Month,
                COUNT(*) as NewMembers
            FROM Members m
            WHERE m.DateJoined >= ?
            GROUP BY FORMAT(m.DateJoined, 'yyyy-MM')
            ORDER BY Month
        """, (datetime.now() - timedelta(days=365),))
        growth_data = [{'month': row[0], 'count': row[1]}
                       for row in cursor.fetchall()]

        # Recent activity
        cursor.execute("""
            SELECT TOP 10
                m.FirstName + ' ' + m.LastName as Name,
                m.DateJoined,
                'New Member' as Activity,
                m.MemberID
            FROM Members m
            WHERE m.DateJoined IS NOT NULL
            ORDER BY m.DateJoined DESC
        """)
        recent_activity = []
        for row in cursor.fetchall():
            recent_activity.append({
                'name': row[0],
                'date': row[1].strftime('%Y-%m-%d') if row[1] else None,
                'activity': row[2],
                'id': row[3]
            })

        # Add recent recognitions to activity
        cursor.execute("""
            SELECT TOP 5
                s.SocietyName as Name,
                r.RecognitionID,
                'Recognition: ' + rt.TypeName as Activity,
                r.RecognitionID
            FROM Recognitions r
            JOIN Society s ON r.SocietyID = s.SocietyID
            JOIN RecognitionType rt ON r.RecognitionTypeID = rt.RecognitionTypeID
            ORDER BY r.RecognitionID DESC
        """)
        for row in cursor.fetchall():
            recent_activity.append({
                'name': row[0],
                'date': datetime.now().strftime('%Y-%m-%d'),
                'activity': row[2],
                'id': row[3]
            })

        # Sort recent activity by date
        recent_activity.sort(
            key=lambda x: x['date'] or '1900-01-01',
            reverse=True)
        recent_activity = recent_activity[:10]

        dashboard_data = {
            'stats': {
                'activeMembers': active_members,
                'inactiveMembers': inactive_members,
                'totalSocieties': total_societies,
                'activeUsers': active_users,
                'recentMembers': recent_members,
                'pendingApprovals': pending_approvals
            },
            'charts': {
                'membersByCategory': categories,
                'membersByCounty': counties,
                'membershipGrowth': growth_data
            },
            'recentActivity': recent_activity
        }

        return jsonify(dashboard_data)

    except Exception as e:
        return jsonify(
            {'error': f'Failed to fetch dashboard data: {str(e)}'}), 500
    finally:
        conn.close()


@app.route("/api/admin/approvals", methods=["GET"])
@admin_required
def get_pending_users():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT [UserID], [Username], [FirstName], [Last Name], [Email], [Role], [CreatedAt]
            FROM [User]
            WHERE [IsApproved] = 0
        """)
        
        users = []
        for row in cursor.fetchall():
            # Note: 'Last Name' has a space in the database
            full_name = f"{row[2]} {row[3]}".strip() if row[2] and row[3] else (row[1] or "Unknown User")
            users.append({
                "userID": row[0],
                "name": full_name,
                "firstName": row[2],
                "lastName": row[3],  # This is actually 'Last Name' field
                "email": row[4] or "No email",
                "access": row[5] or "public",
                "currentRole": row[5],
                "createdAt": row[6].strftime('%Y-%m-%d') if row[6] else None
            })
        
        return jsonify(users)
    except Exception as e:
        return jsonify(
            {'error': f'Failed to fetch pending users: {str(e)}'}), 500
    finally:
        conn.close()


@app.route("/api/admin/approvals", methods=["POST"])
@admin_required
def update_user_approval():
    data = request.json
    user_id = data.get("userID") if data is not None else None
    action = data.get("action") if data is not None else None
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        if action == "approve":
            # Approve the user by setting IsApproved = True
            cursor.execute("""
                UPDATE [User] SET IsApproved = True WHERE UserID = ?
            """, (user_id,))
        elif action == "reject":
            # Delete the unapproved user
            cursor.execute("""
                DELETE FROM [User] WHERE UserID = ?
            """, (user_id,))
        else:
            return jsonify({"error": "Invalid action"}), 400
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify(
            {'error': f'Failed to update user approval: {str(e)}'}), 500
    finally:
        conn.close()

# Enhanced Member Routes with Advanced Search


@app.route('/api/members/search', methods=['GET'])
@auth_required
def search_members():
    """Advanced member search with multiple filters"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()

        # Get query parameters
        search_term = request.args.get('q', '').strip()
        category_id = request.args.get('category')
        county_id = request.args.get('county')
        surname_id = request.args.get('surname')
        occupation_id = request.args.get('occupation')
        is_active = request.args.get('active')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        society_id = request.args.get('society')
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 50)),
                       100)  # Max 100 per page
        sort_by = request.args.get('sort_by', 'lastName')
        sort_order = request.args.get('sort_order', 'asc')

        # Build base query
        base_query = """
            SELECT DISTINCT m.MemberID, m.FirstName, m.LastName, m.Email, m.PhoneNumber,
                   m.[Place of Birth], m.[Date of Birth], m.DateJoined, m.DateEnded,
                   m.IsActive, mc.CategoryName, ic.CountyName, s.Surname,
                   o.OccupationName, m.Notes, soc.SocietyName
            FROM Members m
            LEFT JOIN MemberCategory mc ON m.MemberCategoryID = mc.CategoryID
            LEFT JOIN IrishCounties ic ON m.CountyID = ic.CountyID
            LEFT JOIN IrishSurnames s ON m.SurnameID = s.SurnameID
            LEFT JOIN Occupation o ON m.OccupationID = o.OccupationID
            LEFT JOIN Society soc ON m.SocietyID = soc.SocietyID
            WHERE 1=1
        """

        params = []

        # Apply role-based filtering
        if session['user_role'] == 'Public':
            base_query += " AND m.IsActive = False"

        # Apply search term (full-text search across multiple fields)
        if search_term:
            base_query += """ AND (
                m.FirstName LIKE ? OR m.LastName LIKE ? OR
                m.Email LIKE ? OR m.[Place of Birth] LIKE ? OR
                mc.CategoryName LIKE ? OR ic.CountyName LIKE ? OR
                s.Surname LIKE ? OR o.OccupationName LIKE ? OR
                soc.SocietyName LIKE ? OR m.Notes LIKE ?
            )"""
            search_pattern = f'%{search_term}%'
            params.extend([search_pattern] * 10)

        # Apply filters
        if category_id:
            base_query += " AND m.MemberCategoryID = ?"
            params.append(category_id)

        if county_id:
            base_query += " AND m.CountyID = ?"
            params.append(county_id)

        if surname_id:
            base_query += " AND m.SurnameID = ?"
            params.append(surname_id)

        if occupation_id:
            base_query += " AND m.OccupationID = ?"
            params.append(occupation_id)

        if society_id:
            base_query += " AND m.SocietyID = ?"
            params.append(society_id)

        if is_active is not None:
            base_query += " AND m.IsActive = ?"
            params.append(is_active.lower() == 'true')

        if date_from:
            base_query += " AND m.DateJoined >= ?"
            params.append(date_from)

        if date_to:
            base_query += " AND m.DateJoined <= ?"
            params.append(date_to)

        # Get total count
        count_query = "SELECT COUNT(*) FROM (" + base_query + ") AS counted"
        cursor.execute(count_query, params)
        row = cursor.fetchone()
        total_count = row[0] if row is not None else 0

        # Add sorting
        sort_columns = {
            'firstName': 'm.FirstName',
            'lastName': 'm.LastName',
            'email': 'm.Email',
            'dateJoined': 'm.DateJoined',
            'county': 'ic.CountyName',
            'category': 'mc.CategoryName'
        }

        sort_column = sort_columns.get(sort_by, 'm.LastName')
        sort_direction = 'ASC' if sort_order.lower() == 'asc' else 'DESC'
        base_query += f" ORDER BY {sort_column} {sort_direction}"

        # Add pagination (using OFFSET/FETCH for SQL Server compatibility)
        base_query += (
            f" OFFSET {(page - 1) * per_page} ROWS FETCH NEXT {per_page} ROWS ONLY"
        )

        cursor.execute(base_query, params)
        members = []

        for row in cursor.fetchall():
            members.append({
                'id': row[0],
                'firstName': row[1],
                'lastName': row[2],
                'email': row[3],
                'phoneNumber': row[4],
                'placeOfBirth': row[5],
                'dateOfBirth': row[6].strftime('%Y-%m-%d') if row[6] else None,
                'dateJoined': row[7].strftime('%Y-%m-%d') if row[7] else None,
                'dateEnded': row[8].strftime('%Y-%m-%d') if row[8] else None,
                'isActive': row[9],
                'category': row[10],
                'county': row[11],
                'surname': row[12],
                'occupation': row[13],
                'notes': row[14],
                'society': row[15]
            })

        return jsonify({
            'members': members,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total_count,
                'pages': (total_count + per_page - 1) // per_page
            },
            'filters': {
                'search_term': search_term,
                'category_id': category_id,
                'county_id': county_id,
                'surname_id': surname_id,
                'is_active': is_active
            }
        })

    except Exception as e:
        return jsonify({'error': f'Search failed: {str(e)}'}), 500
    finally:
        conn.close()

# Member CRUD Operations


@app.route('/api/members', methods=['GET'])
@auth_required  # All users must be logged in
def get_members():
    """Get members list with role-based access control"""
    user_role = session.get('user_role', '').lower()  # Default to empty string if no session
    user_id = session.get('user_id')

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()

        # Base query using MS Access JOIN syntax
        query = """
            SELECT 
                m.MemberID, m.FirstName, m.LastName, 
                m.[Place of Birth], m.[Date of Birth],
                m.IsActive, mc.CategoryName, ic.CountyName,
                m.DateJoined, m.DateEnded
            FROM 
                (((Members AS m 
                LEFT JOIN MemberCategory AS mc ON m.MemberCategoryID = mc.CategoryID)
                LEFT JOIN IrishCounties AS ic ON m.CountyID = ic.CountyID))
        """

        # Role-based filtering - all users must be logged in
        if user_role == 'public':
            # Public users - only show inactive/deceased members
            query += " WHERE m.IsActive = False"
        elif user_role in ['private', 'admin']:
            # Private/Admin - show all members
            pass
        else:
            return jsonify({'error': 'Invalid user role'}), 403

        query += " ORDER BY m.LastName, m.FirstName"

        cursor.execute(query)
        members = []
        for row in cursor.fetchall():
            member_data = {
                'id': row[0],
                'firstName': row[1],
                'lastName': row[2],
                'placeOfBirth': row[3],
                'dateOfBirth': row[4].strftime('%Y-%m-%d') if row[4] else None,
                'isActive': bool(row[5]),
                'category': row[6],
                'county': row[7],
                'dateJoined': row[8].strftime('%Y-%m-%d') if row[8] else None,
                'dateEnded': row[9].strftime('%Y-%m-%d') if row[9] else None,
                'membershipYears': calculate_membership_years(row[8], row[9]) if row[8] else None
            }
            members.append(member_data)

        return jsonify(members)

    except Exception as e:
        return jsonify({'error': f'Failed to fetch members: {str(e)}'}), 500
    finally:
        conn.close()

def calculate_membership_years(date_joined, date_ended):
    """Calculate the number of years between join and end dates"""
    if not date_joined:
        return None
    
    end_date = date_ended if date_ended else datetime.now()
    delta = end_date - date_joined
    return round(delta.days / 365.25)  # Account for leap years



@app.route('/api/members/<int:member_id>', methods=['GET'])
@auth_required
def get_member(member_id):
    print('DEBUG PARAM TYPE:', type(member_id), 'DEBUG PARAM VALUE:', member_id)  # Debug: show type and value
    """Get specific member details"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()

        # Check if user has permission to view this member
        if session['user_role'] == 'Public':
            print('DEBUG: Checking public access for member', member_id)
            try:
                cursor.execute("SELECT IsActive FROM Members WHERE MemberID = ?", (member_id,))
                result = cursor.fetchone()
                print('DEBUG: Public access check result:', result)
                if not result or result[0]:  # Active member
                    print('DEBUG: Access denied for public user')
                    return jsonify({'error': 'Access denied'}), 403
            except Exception as e:
                print('DEBUG ERROR during public access check:', e)
                raise

        # Get member details (including all profile fields)
        sql = """
            SELECT m.MemberID, m.FirstName, m.LastName, m.Email, m.PhoneNumber, m.[Place of Birth], m.[Date of Birth],
                   m.MemberCategoryID, c.CategoryName, m.CountyID, co.CountyName, m.SurnameID, s.Surname, m.OccupationID, o.OccupationName,
                   m.Notes, m.IsActive, m.OtherSocieties, m.[DateJoined], m.[DateEnded], m.[ApplicationDate], m.[Approval Date],
                   m.ApprovedBy, m.SignedBy, m.Proposer, m.Seconder, m.[ProposalDate]
            FROM (((((Members AS m
            LEFT JOIN MemberCategory AS c ON m.MemberCategoryID = c.CategoryID)
            LEFT JOIN IrishCounties AS co ON m.CountyID = co.CountyID)
            LEFT JOIN IrishSurnames AS s ON m.SurnameID = s.SurnameID)
            LEFT JOIN Occupation AS o ON m.OccupationID = o.OccupationID))
            WHERE m.MemberID = ?
        """
        print('DEBUG: About to execute member details query:', sql)
        print('DEBUG: Params:', member_id, type(member_id))
        try:
            cursor.execute(sql, (member_id,))
            print('DEBUG: Member details query executed')
            member = cursor.fetchone()
            print('DEBUG: Member details fetched:', member)
        except Exception as e:
            print('DEBUG ERROR during member details query:', e)
            raise
        if not member:
            print('DEBUG: Member not found')
            return jsonify({'error': 'Member not found'}), 404

        # Get member addresses
        try:
            print('DEBUG: About to execute addresses query')
            cursor.execute("""
                SELECT ma.MemberAddressID, ma.Street, ma.City, ma.Province, ma.CountryID, ma.PostalCode, ma.FiscalYearID, ma.IsCurrent, fy.YearLabel, fy.StartDate
                FROM MemberAddress AS ma
                LEFT JOIN FiscalYear AS fy ON ma.FiscalYearID = fy.FiscalYearID
                WHERE ma.MemberID = ?
                ORDER BY ma.IsCurrent DESC, fy.StartDate DESC
            """, (member_id,))
            addresses = cursor.fetchall()
            print('DEBUG: Addresses fetched:', addresses)
        except Exception as e:
            print('DEBUG ERROR during addresses query:', e)
            addresses = []

        # Get member roles & fiscal years (all pairs)
        try:
            print('DEBUG: About to execute role/fiscal year query')
            cursor.execute("""
                SELECT r.RoleName, fy.YearLabel, fy.StartDate, fy.EndDate
                FROM MemberRole AS mr
                INNER JOIN Role AS r ON mr.RoleID = r.RoleID
                INNER JOIN FiscalYear AS fy ON mr.FiscalYearID = fy.FiscalYearID
                WHERE mr.MemberID = ?
            """, (member_id,))
            role_fiscal_years = [{'role': row[0], 'fiscalYear': row[1], 'from': row[2], 'to': row[3]} for row in cursor.fetchall()]
            print('DEBUG: Role/fiscal years fetched:', role_fiscal_years)
        except Exception as e:
            print('DEBUG ERROR during role/fiscal year query:', e)
            role_fiscal_years = []

        # Get Irish Connections (County)
        try:
            print('DEBUG: About to execute Irish connection (county) query')
            cursor.execute("""
                SELECT c.CountyName
                FROM IrishConnectionByCounty AS icc
                INNER JOIN IrishCounties AS c ON icc.CountyID = c.CountyID
                WHERE icc.MemberID = ?
            """, (member_id,))
            irish_counties = [row[0] for row in cursor.fetchall()]
            print('DEBUG: Irish counties fetched:', irish_counties)
        except Exception as e:
            print('DEBUG ERROR during Irish connection (county) query:', e)
            irish_counties = []

        # Get Irish Connections (Surname)
        try:
            print('DEBUG: About to execute Irish connection (surname) query')
            cursor.execute("""
                SELECT s.Surname
                FROM IrishConnectionBySurname AS ics
                INNER JOIN IrishSurnames AS s ON ics.SurnameID = s.SurnameID
                WHERE ics.MemberID = ?
            """, (member_id,))
            irish_surnames = [row[0] for row in cursor.fetchall()]
            print('DEBUG: Irish surnames fetched:', irish_surnames)
        except Exception as e:
            print('DEBUG ERROR during Irish connection (surname) query:', e)
            irish_surnames = []

        # Compose member_data for profile page
        member_data = {
            'id': member[0],
            'firstName': member[1],
            'lastName': member[2],
            'email': member[3] if len(member) > 3 else None,
            'phoneNumber': member[4] if len(member) > 4 else None,
            'placeOfBirth': member[5] if len(member) > 5 else None,
            'dateOfBirth': member[6].strftime('%Y-%m-%d') if len(member) > 6 and member[6] else None,
            'memberCategoryID': member[7] if len(member) > 7 else None,
            'memberCategory': member[8] if len(member) > 8 else None,
            'countyID': member[9] if len(member) > 9 else None,
            'county': member[10] if len(member) > 10 else None,
            'surnameID': member[11] if len(member) > 11 else None,
            'surname': member[12] if len(member) > 12 else None,
            'occupationID': member[13] if len(member) > 13 else None,
            'occupation': member[14] if len(member) > 14 else None,
            'notes': member[15] if len(member) > 15 else None,
            'isActive': member[16] if len(member) > 16 else None,
            'otherSocieties': member[17] if len(member) > 17 else None,
            'dateJoined': member[18].strftime('%Y-%m-%d') if len(member) > 18 and member[18] else None,
            'dateEnded': member[19].strftime('%Y-%m-%d') if len(member) > 19 and member[19] else None,
            'applicationDate': member[20].strftime('%Y-%m-%d') if len(member) > 20 and member[20] else None,
            'approvalDate': member[21].strftime('%Y-%m-%d') if len(member) > 21 and member[21] else None,
            'approvedBy': member[22] if len(member) > 22 else None,
            'signedBy': member[23] if len(member) > 23 else None,
            'proposer': member[24] if len(member) > 24 else None,
            'seconder': member[25] if len(member) > 25 else None,
            'proposalDate': member[26].strftime('%Y-%m-%d') if len(member) > 26 and member[26] else None,
            'addresses': [
                {
                    'id': addr[0],
                    'street': addr[1],
                    'city': addr[2],
                    'province': addr[3],
                    'countryId': addr[4],
                    'postalCode': addr[5],
                    'fiscalYearId': addr[6],
                    'isCurrent': addr[7],
                    'fiscalYear': addr[8],
                    'fiscalYearStart': addr[9]
                } for addr in addresses
            ],
            'roleFiscalYears': role_fiscal_years
        }

        print('DEBUG: Final member_data:', member_data)
        return jsonify(member_data)

    except Exception as e:
        print('DEBUG ERROR in get_member:', e)
        return jsonify({'error': f'Failed to fetch member: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/members', methods=['POST'])
@admin_required
def create_member():
    """Create new member (Admin only)"""
    data = request.get_json()

    if not data:
        return jsonify({'error': 'Invalid input data'}), 400

    required_fields = ['firstName', 'lastName']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO Members (
                [FirstName], [LastName], [Email], [PhoneNumber],
                [Place of Birth], [Date of Birth], [MemberCategoryID],
                [CountyID], [SurnameID], [OccupationID], [Notes],
                [IsActive], [OtherSocieties], [DateJoined], [DateEnded],
                [ApplicationDate], [Approval Date], [ApprovedBy], [SignedBy],
                [Proposer], [Seconder], [ProposalDate]
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data.get('firstName'),
            data.get('lastName'),
            data.get('email'),
            data.get('phoneNumber', None),
            data.get('placeOfBirth', None),
            data.get('dateOfBirth', None),
            data.get('categoryId', None),
            data.get('countyId', None),
            data.get('surnameId', None),
            data.get('occupationId', None),
            data.get('notes', ''),
            data.get('isActive', True),
            data.get('otherSocieties', None),
            data.get('dateJoined', None),
            data.get('dateEnded', None),
            data.get('applicationDate', None),
            data.get('approvalDate', None),
            data.get('approvedBy', None),
            data.get('signedBy', None),
            data.get('proposer', None),
            data.get('seconder', None),
            data.get('proposalDate', None)
        ))

        conn.commit()

        cursor.execute("SELECT @@IDENTITY")
        row = cursor.fetchone()
        member_id = row[0] if row is not None else None
        if member_id is None:
            return jsonify({'error': 'Failed to retrieve new member ID'}), 500

        log_audit_event(
            session.get('user_id', 'unknown'),
            'CREATE',
            'Members',
            member_id,
            f'Created member: {data.get("firstName")} {data.get("lastName")}')

        return jsonify({'success': True, 'member_id': member_id}), 201

    except Exception as e:
        return jsonify({'error': f'Failed to create member: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/members/<int:member_id>', methods=['PUT'])
@admin_required
def update_member(member_id):
    """Update member (Admin only)"""
    data = request.get_json()

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()

        # Check if member exists
        cursor.execute(
            "SELECT * FROM Members WHERE MemberID = ?", (member_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Member not found'}), 404

        cursor.execute("""
            UPDATE Members SET
                [FirstName] = ?,
                [LastName] = ?,
                [Email] = ?,
                [PhoneNumber] = ?,
                [Place of Birth] = ?,
                [Date of Birth] = ?,
                [MemberCategoryID] = ?,
                [CountyID] = ?,
                [SurnameID] = ?,
                [OccupationID] = ?,
                [Notes] = ?,
                [IsActive] = ?,
                [OtherSocieties] = ?,
                [DateJoined] = ?,
                [DateEnded] = ?,
                [ApplicationDate] = ?,
                [Approval Date] = ?,
                [ApprovedBy] = ?,
                [SignedBy] = ?,
                [Proposer] = ?,
                [Seconder] = ?,
                [ProposalDate] = ?
            WHERE [MemberID] = ?
        """,
        (
            data.get('firstName'),
            data.get('lastName'),
            data.get('email'),
            data.get('phoneNumber', None),
            data.get('placeOfBirth', None),
            data.get('dateOfBirth', None),
            data.get('categoryId', None),
            data.get('countyId', None),
            data.get('surnameId', None),
            data.get('occupationId', None),
            data.get('notes', ''),
            data.get('isActive', True),
            data.get('otherSocieties', None),
            data.get('dateJoined', None),
            data.get('dateEnded', None),
            data.get('applicationDate', None),
            data.get('approvalDate', None),
            data.get('approvedBy', None),
            data.get('signedBy', None),
            data.get('proposer', None),
            data.get('seconder', None),
            data.get('proposalDate', None),
            member_id
        ))

        conn.commit()

        # Log audit event
        log_audit_event(
            session['user_id'],
            'UPDATE',
            'Members',
            member_id,
            f'Updated member: {data.get("firstName")} {data.get("lastName")}')

        return jsonify({'success': True})

    except Exception as e:
        return jsonify({'error': f'Failed to update member: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/members/<int:member_id>', methods=['DELETE'])
@admin_required
def delete_member(member_id):
    """Delete member (Admin only)"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()

        # Get member name for logging
        cursor.execute(
            "SELECT FirstName, LastName FROM Members WHERE MemberID = ?", (member_id,))
        member = cursor.fetchone()
        if not member:
            return jsonify({'error': 'Member not found'}), 404

        # Soft delete - set as inactive instead of actual deletion
        cursor.execute("""
            UPDATE Members
            SET IsActive = False, DateEnded = ?
            WHERE MemberID = ?
        """, (datetime.now(), member_id))

        conn.commit()

        # Log audit event
        log_audit_event(session['user_id'], 'DELETE', 'Members', member_id,
                        f'Deactivated member: {member[0]} {member[1]}')

        return jsonify({'success': True})

    except Exception as e:
        return jsonify({'error': f'Failed to delete member: {str(e)}'}), 500
    finally:
        conn.close()

# === Society Management Routes ===


@app.route('/api/societies', methods=['GET'])
@auth_required
def get_societies():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.SocietyID, s.SocietyName, s.Description, s.FoundedDate,
                   s.IncorporatedDate, s.CharityNumber, s.NonProfitNumber,
                   COUNT(m.MemberID) as MemberCount
            FROM Society s
            LEFT JOIN Members m ON s.SocietyID = m.SocietyID AND m.IsActive = True
            GROUP BY s.SocietyID, s.SocietyName, s.Description, s.FoundedDate,
                     s.IncorporatedDate, s.CharityNumber, s.NonProfitNumber
            ORDER BY s.SocietyName
        """)
        societies = []
        for row in cursor.fetchall():
            societies.append({
                'id': row[0],
                'name': row[1],
                'description': row[2],
                'foundedDate': row[3].strftime('%Y-%m-%d') if row[3] else None,
                'incorporatedDate': row[4].strftime('%Y-%m-%d') if row[4] else None,
                'charityNumber': row[5],
                'nonProfitNumber': row[6],
                'memberCount': row[7]
            })
        return jsonify(societies)
    except Exception as e:
        return jsonify({'error': f'Failed to fetch societies: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/societies', methods=['POST'])
@admin_required
def create_society():
    data = request.get_json()
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO Society (SocietyName, Description, FoundedDate,
                                 IncorporatedDate, CharityNumber, NonProfitNumber)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            data.get('name'),
            data.get('description'),
            data.get('foundedDate'),
            data.get('incorporatedDate'),
            data.get('charityNumber'),
            data.get('nonProfitNumber')
        ))
        conn.commit()
        cursor.execute("SELECT @@IDENTITY")
        row = cursor.fetchone()
        society_id = row[0] if row is not None else None
        if society_id is None:
            return jsonify({'error': 'Failed to retrieve new society ID'}), 500
        return jsonify({'success': True, 'society_id': society_id}), 201
    except Exception as e:
        return jsonify({'error': f'Failed to create society: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/societies/<int:society_id>', methods=['PUT'])
@admin_required
def update_society(society_id):
    data = request.get_json()
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE Society
            SET SocietyName = ?, Description = ?, FoundedDate = ?,
                IncorporatedDate = ?, CharityNumber = ?, NonProfitNumber = ?
            WHERE SocietyID = ?
        """, (
            data.get('name'),
            data.get('description'),
            data.get('foundedDate'),
            data.get('incorporatedDate'),
            data.get('charityNumber'),
            data.get('nonProfitNumber'),
            society_id
        ))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': f'Failed to update society: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/societies/<int:society_id>', methods=['DELETE'])
@admin_required
def delete_society(society_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT COUNT(*) FROM Members WHERE SocietyID = ?", (society_id,))
        row = cursor.fetchone()
        if row is None:
            return jsonify({'error': 'Failed to count members for society'}), 500
        if row[0] > 0:
            return jsonify(
                {'error': 'Cannot delete society with members. Remove members first.'}), 400
        cursor.execute(
            "DELETE FROM Society WHERE SocietyID = ?", (society_id,))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': f'Failed to delete society: {str(e)}'}), 500
    finally:
        conn.close()

# === Recognition Routes (Society-based) ===


@app.route('/api/recognitions', methods=['GET'])
@auth_required
def get_recognitions():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT r.RecognitionID, r.Description, r.IsActive, rt.TypeName, s.SocietyName, fy.YearLabel 
            FROM ((Recognitions r 
            LEFT JOIN RecognitionType rt ON r.RecognitionTypeID = rt.RecognitionTypeID) 
            LEFT JOIN Society s ON r.SocietyID = s.SocietyID) 
            LEFT JOIN FiscalYear fy ON r.FiscalYearID = fy.FiscalYearID 
            ORDER BY r.RecognitionID DESC
        """)
        recognitions = []
        for row in cursor.fetchall():
            recognitions.append({
                'id': row[0], 'description': row[1], 'isActive': row[2],
                'type': row[3], 'society': row[4], 'fiscalYear': row[5]
            })
        return jsonify(recognitions)
    except Exception as e:
        return jsonify(
            {'error': f'Failed to fetch recognitions: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/recognitions', methods=['POST'])
@admin_required
def create_recognition():
    data = request.get_json()
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO Recognitions (SocietyID, RecognitionTypeID, FiscalYearID,
                                      Description, IsActive)
            VALUES (?, ?, ?, ?, ?)
        """, (
            data.get('societyId'),
            data.get('recognitionTypeId'),
            data.get('fiscalYearId'),
            data.get('description'),
            data.get('isActive', True)
        ))
        conn.commit()
        cursor.execute("SELECT @@IDENTITY")
        row = cursor.fetchone()
        new_id = row[0] if row is not None else None
        if new_id is None:
            return jsonify({'error': 'Failed to retrieve new recognition ID'}), 500
        return jsonify({'success': True, 'recognitionId': new_id}), 201
    except Exception as e:
        return jsonify(
            {'error': f'Failed to create recognition: {str(e)}'}), 500
    finally:
        conn.close()

# User Management Routes (Admin Functions)
@app.route('/api/users/<int:user_id>/role', methods=['PUT'])
@admin_required
def change_user_role(user_id):
    """Change a user's role (Admin only)"""
    data = request.get_json()
    new_role = data.get('role')
    if new_role not in ['admin', 'private', 'public']:
        return jsonify({'error': 'Invalid role value'}), 400
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        # Check if user exists
        cursor.execute("SELECT Username FROM [User] WHERE UserID = ?", (user_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        # Update role
        cursor.execute("UPDATE [User] SET Role = ? WHERE UserID = ?", (new_role, user_id))
        conn.commit()
        log_audit_event(session['user_id'], 'ROLE_CHANGE', 'User', user_id,
                        f'Changed role to {new_role} for user: {user[0]}')
        return jsonify({'success': True, 'role': new_role})
    except Exception as e:
        return jsonify({'error': f'Failed to change user role: {str(e)}'}), 500
    finally:
        conn.close()
@app.route('/api/users/<int:user_id>/approve', methods=['PUT'])
@admin_required
def approve_user(user_id):
    """Approve a user account (Admin only)"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        # Check if user exists
        cursor.execute("SELECT Username FROM [User] WHERE UserID = ?", (user_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        # Approve user
        cursor.execute("UPDATE [User] SET IsApproved = True WHERE UserID = ?", (user_id,))
        conn.commit()
        log_audit_event(session['user_id'], 'APPROVE', 'User', user_id,
                        f'Approved user: {user[0]}')
        return jsonify({'success': True, 'status': 'approved'})
    except Exception as e:
        return jsonify({'error': f'Failed to approve user: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/users', methods=['GET'])
@admin_required
def get_users():
    """Get all users (Admin only)"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT [UserID], [Username], [FirstName], [Last Name], [Email], [Role], [IsApproved], [CreatedAt], [LastLogin]
            FROM [User]
            ORDER BY [UserID] DESC
        """)

        users = []
        for row in cursor.fetchall():
            users.append({
                'id': row[0],
                'userID': row[0],
                'username': row[1],
                'firstName': row[2],
                'lastName': row[3],
                'email': row[4],
                'role': row[5],
                'isApproved': row[6],
                'isActive': row[6],  # Using IsApproved as isActive for now
                'createdDate': row[7].strftime('%Y-%m-%d') if row[7] else None,
                'lastLogin': row[8].strftime('%Y-%m-%d %H:%M:%S') if row[8] else None
            })

        return jsonify(users)

    except Exception as e:
        return jsonify({'error': f'Failed to fetch users: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/users', methods=['POST'])
@admin_required
def create_user():
    """Create new user (Admin only)"""
    data = request.get_json()

    if not data.get('username') or not data.get(
            'email') or not data.get('password'):
        return jsonify(
            {'error': 'Username, email, and password are required'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()

        # Check if username or email already exists
        cursor.execute(
            "SELECT UserID FROM [User] WHERE Username = ? OR Email = ?",
            (data.get('username'),
             data.get('email')))
        if cursor.fetchone():
            return jsonify({'error': 'Username or email already exists'}), 400

        hashed_password = hash_password(data.get('password'))

        cursor.execute("""
            INSERT INTO [User] (Username, Email, PasswordHash, Role, IsApproved, CreatedAt)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            data.get('username'),
            data.get('email'),
            hashed_password,
            data.get('role', 'Public'),
            data.get('isApproved', False),
            datetime.now()
        ))

        conn.commit()

        # Get the new user ID
        cursor.execute("SELECT @@IDENTITY")
        row = cursor.fetchone()
        user_id = row[0] if row is not None else None
        if user_id is None:
            return jsonify({'error': 'Failed to retrieve new user ID'}), 500

        # Log audit event
        log_audit_event(session['user_id'], 'CREATE', 'User', user_id,
                        f'Created user: {data.get("username")}')

        return jsonify({'success': True, 'user_id': user_id}), 201

    except Exception as e:
        return jsonify({'error': f'Failed to create user: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    """Request password reset"""
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({'error': 'Email is required'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()

        # Check if email exists
        cursor.execute(
            "SELECT UserID, Username FROM [User] WHERE Email = ?", (email,))
        user = cursor.fetchone()

        if user:
            # Generate reset token
            reset_token = generate_reset_token()
            reset_expires = datetime.now() + timedelta(hours=1)

            # Store reset token
            cursor.execute("""
                UPDATE [User]
                SET ResetToken = ?, ResetRequestedAt = ?
                WHERE UserID = ?
            """, (reset_token, datetime.now(), user[0]))
            conn.commit()

            # Send reset email
            reset_link = f"http://your-domain.com/reset-password?token={reset_token}"
            send_email(
                email,
                "Password Reset - BIS Membership Database",
                f"""
                <h2>Password Reset Request</h2>
                <p>Dear {user[1]},</p>
                <p>You have requested a password reset. Click the link below to reset your password:</p>
                <p><a href="{reset_link}">Reset Password</a></p>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this reset, please ignore this email.</p>
                <p>Best regards,<br>BIS Admin Team</p>
                """
            )

        # Always return success to prevent email enumeration
        return jsonify(
            {'success': True, 'message': 'If the email exists, a reset link has been sent'})

    except Exception as e:
        return jsonify(
            {'error': f'Failed to process password reset: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    """Reset password with token"""
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('password')

    if not token or not new_password:
        return jsonify({'error': 'Token and new password are required'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()

        # Verify token
        cursor.execute("""
            SELECT UserID, Username
            FROM [User]
            WHERE ResetToken = ? AND ResetRequestedAt > ?
        """, (token, datetime.now() - timedelta(hours=1)))

        user = cursor.fetchone()
        if not user:
            return jsonify({'error': 'Invalid or expired token'}), 400

        # Update password and clear token
        hashed_password = hash_password(new_password)
        cursor.execute("""
            UPDATE [User]
            SET PasswordHash = ?, ResetToken = NULL, ResetTokenExpires = NULL
            WHERE UserID = ?
        """, (hashed_password, user[0]))
        conn.commit()

        # Log audit event
        log_audit_event(user[0], 'PASSWORD_RESET', 'User', user[0],
                        f'Password reset for user: {user[1]}')

        return jsonify({'success': True})

    except Exception as e:
        return jsonify({'error': f'Failed to reset password: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/reset-password-noemail', methods=['POST'])
def reset_password_no_email():
    """Reset password without email (by UserID)"""
    data = request.get_json()
    user_id = data.get('user_id')
    new_password = data.get('password')
    confirm_password = data.get('confirm_password')

    if not user_id or not new_password or not confirm_password:
        return jsonify({'error': 'All fields are required'}), 400

    if new_password != confirm_password:
        return jsonify({'error': 'Passwords do not match'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()

        # Check if user exists and has no email
        cursor.execute(
            "SELECT Username FROM [User] WHERE UserID = ? AND (Email IS NULL OR Email = '')",
            (user_id,
             ))
        user = cursor.fetchone()
        if not user:
            return jsonify(
                {'error': 'User not found or user has an email'}), 404

        hashed_password = hash_password(new_password)

        # Update password
        cursor.execute("""
            UPDATE [User]
            SET PasswordHash = ?, ResetToken = NULL, ResetTokenExpires = NULL
            WHERE UserID = ?
        """, (hashed_password, user_id))
        conn.commit()

        log_audit_event(user_id, 'PASSWORD_RESET_NOEMAIL', 'User', user_id,
                        f'Password manually reset for user: {user[0]}')

        return jsonify({'success': True,
                        'message': 'Password reset successfully'})

    except Exception as e:
        return jsonify({'error': f'Failed to reset password: {str(e)}'}), 500
    finally:
        conn.close()


# File/Photo Management Routes
@app.route('/api/members/<int:member_id>/photos', methods=['POST'])
@admin_required
def upload_photo(member_id):
    """Upload photo for member (Admin only)"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if not file or not file.filename:
        return jsonify({'error': 'No file selected'}), 400

    if not allowed_file(file.filename) or not is_photo_file(file.filename):
        return jsonify(
            {'error': 'Invalid file type. Only images allowed.'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        # Check if member exists
        cursor = conn.cursor()
        cursor.execute(
            "SELECT MemberID FROM Members WHERE MemberID = ?", (member_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Member not found'}), 404

        # Generate unique filename
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(PHOTO_FOLDER, unique_filename)

        # Save file
        file.save(file_path)

        # Resize image if too large
        if Image is not None:
            try:
                with Image.open(file_path) as img:
                    if img.width > 800 or img.height > 800:
                        # Type-safe, version-compatible resample for Pillow
                        img.thumbnail((800, 800), Image.Resampling.LANCZOS)
                        img.save(file_path)
            except Exception as e:
                logger.warning(f"Image resize failed: {e}")

        # Save to database
        description = request.form.get('description', '')
        cursor.execute("""
            INSERT INTO Photos (MemberID, FileName, Description, UploadDate)
            VALUES (?, ?, ?, ?)
        """, (member_id, unique_filename, description, datetime.now()))
        conn.commit()

        # Get photo ID
        cursor.execute("SELECT @@IDENTITY")
        row = cursor.fetchone()
        photo_id = row[0] if row is not None else None
        if photo_id is None:
            return jsonify({'error': 'Failed to retrieve new photo ID'}), 500

        # Log audit event
        log_audit_event(session['user_id'], 'UPLOAD_PHOTO', 'Photos', photo_id,
                        f'Uploaded photo for member ID: {member_id}')

        return jsonify({'success': True, 'photo_id': photo_id,
                       'filename': unique_filename})

    except Exception as e:
        return jsonify({'error': f'Failed to upload photo: {str(e)}'}), 500
    finally:
        conn.close()




# Photo deletion endpoint (fixed)
@app.route('/api/photos/<int:photo_id>', methods=['DELETE'])
@auth_required
def delete_photo(photo_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        # Get photo details
        cursor.execute(
            "SELECT FileName, MemberID FROM Photos WHERE PhotoID = ?", (photo_id,))
        photo = cursor.fetchone()
        if not photo:
            return jsonify({'error': 'Photo not found'}), 404

        # Delete file
        file_path = os.path.join(PHOTO_FOLDER, photo[0])
        if os.path.exists(file_path):
            os.remove(file_path)

        # Delete from database
        cursor.execute("DELETE FROM Photos WHERE PhotoID = ?", (photo_id,))
        conn.commit()

        # Log audit event
        log_audit_event(session['user_id'], 'DELETE_PHOTO', 'Photos', photo_id,
                        f'Deleted photo for member ID: {photo[1]}')

        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': f'Failed to delete photo: {str(e)}'}), 500
    finally:
        conn.close()

# Notification System Routes


@app.route("/api/notifications", methods=["GET"])
def get_notifications():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT NotificationID, Message, DateCreated, IsRead
            FROM Notifications
            WHERE UserID = ?
            ORDER BY DateCreated DESC
        """, (user_id,))
        rows = cursor.fetchall()
        notifications = []
        unread_count = 0
        for row in rows:
            notifications.append({
                "id": row[0],
                "message": row[1],
                "dateCreated": row[2],
                "isRead": row[3]
            })
            if not row[3]:
                unread_count += 1
        return jsonify({
            "notifications": notifications,
            "unreadCount": unread_count
        })
    except Exception as e:
        return jsonify(
            {'error': f'Failed to fetch notifications: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/notifications/<int:notification_id>/read', methods=['PUT'])
@auth_required
def mark_notification_read(notification_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE Notification
            SET IsRead = True
            WHERE NotificationID = ? AND UserID = ?
        """, (notification_id, session['user_id']))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify(
            {'error': f'Failed to mark notification as read: {str(e)}'}), 500
    finally:
        conn.close()


def create_notification(user_id, message, notif_type="system"):
    conn = get_db_connection()
    if not conn:
        return
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO Notifications (UserID, Message, Type, DateCreated, IsRead)
            VALUES (?, ?, ?, ?, False)
        """, (user_id, message, notif_type, datetime.now()))
        conn.commit()
    except Exception as e:
        logger.error(f"Failed to create notification: {e}")
    finally:
        conn.close()


@app.route('/api/export/members/csv', methods=['GET'])
@private_or_admin_required
def export_members_csv():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT m.FirstName, m.LastName, m.Email, m.PhoneNumber, 
                   m.[Place of Birth], m.[Date of Birth], m.DateJoined, m.IsActive, 
                   mc.CategoryName, ic.CountyName 
            FROM (Members m 
            LEFT JOIN MemberCategory mc ON m.MemberCategoryID = mc.CategoryID) 
            LEFT JOIN IrishCounties ic ON m.CountyID = ic.CountyID
        """)
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['First Name',
                         'Last Name',
                         'Email',
                         'Phone',
                         'Place of Birth',
                         'Date of Birth',
                         'Date Joined',
                         'Active',
                         'Category',
                         'County'])
        for row in cursor.fetchall():
            writer.writerow([
                row[0] or '',  # FirstName
                row[1] or '',  # LastName
                row[2] or '',  # Email
                row[3] or '',  # PhoneNumber
                row[4] or '',  # Place of Birth
                row[5].strftime('%Y-%m-%d') if row[5] else '',  # Date of Birth
                row[6].strftime('%Y-%m-%d') if row[6] else '',  # DateJoined
                'Yes' if row[7] else 'No',  # IsActive
                row[8] or '',  # CategoryName
                row[9] or ''   # CountyName
            ])
        output.seek(0)
        return Response(output, mimetype='text/csv', headers={
            "Content-Disposition": "attachment;filename=members.csv"
        })
    except Exception as e:
        return jsonify({'error': f'Failed to export CSV: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/export/members/pdf', methods=['GET'])
@private_or_admin_required
def export_members_pdf():
    category_filter = request.args.get('category')
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        query = """
            SELECT m.FirstName, m.LastName, m.Email, m.PhoneNumber, 
                   m.[Place of Birth], m.[Date of Birth], m.DateJoined, m.IsActive, 
                   mc.CategoryName, ic.CountyName 
            FROM (Members m 
            LEFT JOIN MemberCategory mc ON m.MemberCategoryID = mc.CategoryID) 
            LEFT JOIN IrishCounties ic ON m.CountyID = ic.CountyID
        """
        values = []
        if category_filter:
            # Skip category filtering for now since we don't know the field name
            pass

        cursor.execute(query, values)
        
        # Fetch all data and check if we have any
        all_rows = cursor.fetchall()
        row_count = len(all_rows)
        
        try:
            pdf = FPDF()
            pdf.add_page()
            pdf.set_font("Arial", 'B', 16)
            pdf.cell(200, 15, "BIS Membership Directory", ln=True, align='C')
            pdf.ln(5)
            
            # Add record count and date
            pdf.set_font("Arial", size=10)
            pdf.cell(200, 8, f"Total Members: {row_count}", ln=True, align='L')
            pdf.cell(200, 8, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", ln=True, align='L')
            pdf.ln(10)
            
            if row_count == 0:
                pdf.set_font("Arial", size=12)
                pdf.cell(200, 10, "No member records found in database", ln=True, align='C')
            else:
                # Simple list format instead of complex table
                pdf.set_font("Arial", 'B', 12)
                pdf.cell(200, 8, "Member Directory:", ln=True, align='L')
                pdf.ln(5)
                
                pdf.set_font("Arial", size=10)
                for i, row in enumerate(all_rows, 1):
                    full_name = f"{row[0] or ''} {row[1] or ''}".strip()
                    email = row[2] or 'No email'
                    phone = row[3] or 'No phone'
                    category = row[8] or 'No category'
                    county = row[9] or 'No county'
                    active_status = 'Active' if row[7] else 'Inactive'
                    joined = row[6].strftime('%Y-%m-%d') if row[6] else 'Unknown'
                    
                    # Member entry
                    pdf.set_font("Arial", 'B', 11)
                    pdf.cell(200, 6, f"{i}. {full_name}", ln=True, align='L')
                    
                    pdf.set_font("Arial", size=9)
                    pdf.cell(200, 5, f"   Email: {email}", ln=True, align='L')
                    pdf.cell(200, 5, f"   Phone: {phone}", ln=True, align='L')
                    pdf.cell(200, 5, f"   Category: {category} | County: {county}", ln=True, align='L')
                    pdf.cell(200, 5, f"   Status: {active_status} | Joined: {joined}", ln=True, align='L')
                    pdf.ln(3)
            
            # Generate PDF
            pdf_output = pdf.output(dest='S').encode('latin1')
            
            response = Response(
                pdf_output,
                mimetype='application/pdf',
                headers={
                    'Content-Disposition': 'attachment; filename=bis_members_directory.pdf',
                    'Content-Type': 'application/pdf'
                }
            )
            return response
            
        except Exception as pdf_error:
            return jsonify({'error': f'PDF generation failed: {str(pdf_error)}'}), 500
        response.headers.set('Content-Type', 'application/pdf')
        return response

    except Exception as e:
        return jsonify({'error': f'Failed to export PDF: {str(e)}'}), 500
    finally:
        conn.close()

# Export Members by Fiscal Year(CSV)


@app.route('/api/export/members/fiscalyear/csv', methods=['GET'])
@private_or_admin_required
def export_members_by_fiscal_year_csv():
    fiscal_year_id = request.args.get('fiscalYearId')

    if not fiscal_year_id:
        return jsonify({'error': 'FiscalYearId is required'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT m.FirstName, m.LastName, m.Email, ic.CountyName, mc.CategoryName, fy.YearLabel
            FROM Members m
            LEFT JOIN IrishCounties ic ON m.CountyID = ic.CountyID
            LEFT JOIN MemberCategory mc ON m.MemberCategoryID = mc.CategoryID
            LEFT JOIN MemberFiscalYear mf ON m.MemberID = mf.MemberID
            LEFT JOIN FiscalYear fy ON mf.FiscalYearID = fy.FiscalYearID
            WHERE mf.FiscalYearID = ?
        """, (fiscal_year_id,))

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['First Name', 'Last Name', 'Email',
                        'County', 'Category', 'Fiscal Year'])

        for row in cursor.fetchall():
            writer.writerow([row[0], row[1], row[2], row[3], row[4], row[5]])

        output.seek(0)
        return Response(output, mimetype='text/csv', headers={
            "Content-Disposition": "attachment;filename=members_fiscalyear.csv"
        })

    except Exception as e:
        return jsonify({'error': f'Failed to export CSV: {str(e)}'}), 500
    finally:
        conn.close()

# Export Recognitions by Fiscal Year(CSV)


@app.route('/api/export/recognitions/fiscalyear/csv', methods=['GET'])
@private_or_admin_required
def export_recognitions_by_fiscal_year_csv():
    fiscal_year_id = request.args.get('fiscalYearId')

    if not fiscal_year_id:
        return jsonify({'error': 'FiscalYearId is required'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.SocietyName, rt.TypeName, r.Description, fy.YearLabel, r.IsActive
            FROM Recognitions r
            LEFT JOIN RecognitionType rt ON r.RecognitionTypeID = rt.RecognitionTypeID
            LEFT JOIN Society s ON r.SocietyID = s.SocietyID
            LEFT JOIN FiscalYear fy ON r.FiscalYearID = fy.FiscalYearID
            WHERE r.FiscalYearID = ?
        """, (fiscal_year_id,))

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['Society', 'Recognition Type',
                        'Description', 'Fiscal Year', 'Active'])

        for row in cursor.fetchall():
            writer.writerow([row[0], row[1], row[2], row[3],
                            'Yes' if row[4] else 'No'])

        output.seek(0)
        return Response(
            output,
            mimetype='text/csv',
            headers={
                "Content-Disposition": "attachment;filename=recognitions_fiscalyear.csv"})

    except Exception as e:
        return jsonify({'error': f'Failed to export CSV: {str(e)}'}), 500
    finally:
        conn.close()

# Export Members by Fiscal Year(PDF)


@app.route('/api/export/members/fiscalyear/pdf', methods=['GET'])
@private_or_admin_required
def export_members_by_fiscal_year_pdf():
    fiscal_year_id = request.args.get('fiscalYearId')

    if not fiscal_year_id:
        return jsonify({'error': 'FiscalYearId is required'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT m.FirstName, m.LastName, m.Email, ic.CountyName, mc.CategoryName, fy.YearLabel
            FROM Members m
            LEFT JOIN IrishCounties ic ON m.CountyID = ic.CountyID
            LEFT JOIN MemberCategory mc ON m.MemberCategoryID = mc.CategoryID
            LEFT JOIN MemberFiscalYear mf ON m.MemberID = mf.MemberID
            LEFT JOIN FiscalYear fy ON mf.FiscalYearID = fy.FiscalYearID
            WHERE mf.FiscalYearID = ?
        """, (fiscal_year_id,))

        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", 'B', 14)
        pdf.cell(200, 10, "Members by Fiscal Year", ln=True, align='C')
        pdf.ln(10)

        pdf.set_font("Arial", size=10)
        for row in cursor.fetchall():
            pdf.cell(
                0, 10, f"{
                    row[0]} {
                    row[1]}, {
                    row[2]}, {
                    row[3]}, {
                        row[4]}, FY: {
                            row[5]}", ln=True)

        pdf_bytes = pdf.output(dest='S')
        if isinstance(pdf_bytes, bytearray):
            pdf_bytes = bytes(pdf_bytes)
        response = Response(pdf_bytes)
        response.headers.set(
            'Content-Disposition',
            'attachment',
            filename='members_by_fiscal_year.pdf')
        response.headers.set('Content-Type', 'application/pdf')
        return response

    except Exception as e:
        return jsonify({'error': f'Failed to export PDF: {str(e)}'}), 500
    finally:
        conn.close()

# Export Recognitions by Fiscal Year(PDF)


@app.route('/api/export/recognitions/fiscalyear/pdf', methods=['GET'])
@private_or_admin_required
def export_recognitions_by_fiscal_year_pdf():
    fiscal_year_id = request.args.get('fiscalYearId')

    if not fiscal_year_id:
        return jsonify({'error': 'FiscalYearId is required'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.SocietyName, rt.TypeName, r.Description, fy.YearLabel, r.IsActive
            FROM Recognitions r
            LEFT JOIN RecognitionType rt ON r.RecognitionTypeID = rt.RecognitionTypeID
            LEFT JOIN Society s ON r.SocietyID = s.SocietyID
            LEFT JOIN FiscalYear fy ON r.FiscalYearID = fy.FiscalYearID
            WHERE r.FiscalYearID = ?
        """, (fiscal_year_id,))

        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", 'B', 14)
        pdf.cell(200, 10, "Recognitions by Fiscal Year", ln=True, align='C')
        pdf.ln(10)

        pdf.set_font("Arial", size=10)
        for row in cursor.fetchall():
            pdf.cell(
                0, 10, f"{
                    row[0]} - {
                    row[1]} | {
                    row[2]} | FY: {
                    row[3]} | Active: {
                        'Yes' if row[4] else 'No'}", ln=True)

        pdf_bytes = pdf.output(dest='S')
        if isinstance(pdf_bytes, bytearray):
            pdf_bytes = bytes(pdf_bytes)
        response = Response(pdf_bytes)
        response.headers.set(
            'Content-Disposition',
            'attachment',
            filename='recognitions_by_fiscal_year.pdf')
        response.headers.set('Content-Type', 'application/pdf')
        return response

    except Exception as e:
        return jsonify({'error': f'Failed to export PDF: {str(e)}'}), 500
    finally:
        conn.close()

# --- Change Password ---


@app.route('/api/my-profile/change-password', methods=['POST'])
@private_or_admin_required
def change_my_password():
    """Allow Private/Admin users to change their password"""
    data = request.get_json()
    current_password = data.get('current_password')
    new_password = data.get('new_password')

    if not current_password or not new_password:
        return jsonify(
            {'error': 'Both current and new passwords are required'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()

        # Verify current password
        cursor.execute(
            "SELECT PasswordHash FROM [User] WHERE UserID = ?", (session['user_id'],))
        result = cursor.fetchone()
        if not result or not verify_password(current_password, result[0]):
            return jsonify({'error': 'Current password is incorrect'}), 403

        # Set new password
        hashed_password = hash_password(new_password)
        cursor.execute("""
            UPDATE [User]
            SET PasswordHash = ?
            WHERE UserID = ?
        """, (hashed_password, session['user_id']))
        conn.commit()

        log_audit_event(
            session['user_id'],
            'CHANGE_PASSWORD',
            'User',
            session['user_id'],
            'Changed own password')

        return jsonify({'success': True,
                        'message': 'Password updated successfully'})
    except Exception as e:
        return jsonify({'error': f'Failed to change password: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/my-profile/photo', methods=['POST'])
@private_or_admin_required
def upload_profile_photo():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if not file or not file.filename:
        return jsonify({'error': 'Empty filename'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type'}), 400

    try:
        filename = secure_filename(file.filename)
        unique_filename = f"profile_{
            session['user_id']}_{
            uuid.uuid4()}_{filename}"
        file_path = os.path.join(PHOTO_FOLDER, unique_filename)
        file.save(file_path)

        # Optional resize with PIL here...

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE [User]
            SET ProfilePhoto = ?
            WHERE UserID = ?
        """, (unique_filename, session['user_id']))
        conn.commit()

        log_audit_event(
            session['user_id'],
            'UPLOAD_PHOTO',
            'User',
            session['user_id'],
            'Uploaded profile photo')

        return jsonify({'success': True, 'filename': unique_filename})
    except Exception as e:
        return jsonify({'error': f'Photo upload failed: {str(e)}'}), 500

# --- Deactivate/Activate User ---


@app.route('/api/users/<int:user_id>/status', methods=['PUT'])
@admin_required
def toggle_user_status(user_id):
    """Activate or deactivate user account (Admin only)"""
    data = request.get_json()
    is_approved = data.get('isApproved')
    if is_approved not in [True, False]:
        return jsonify({'error': 'Invalid approval value'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()

        # Check if user exists
        cursor.execute(
            "SELECT Username FROM [User] WHERE UserID = ?", (user_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        cursor.execute(
            "UPDATE [User] SET IsApproved = ? WHERE UserID = ?", (is_approved, user_id))
        conn.commit()
        status_str = "approved" if is_approved else "disapproved"
        log_audit_event(session['user_id'], 'STATUS_CHANGE', 'User', user_id,
                        f'{status_str.capitalize()} user: {user[0]}')
        return jsonify({'success': True, 'status': status_str})

    except Exception as e:
        return jsonify(
            {'error': f'Failed to update user status: {str(e)}'}), 500
    finally:
        conn.close()

# --- Search Page Dropdowns ---


@app.route('/api/search-filters', methods=['GET'])
@auth_required
def get_search_filters():
    """Return lists of categories, counties, surnames, occupations, societies"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500
    try:
        cursor = conn.cursor()

        def fetch_table(query):
            cursor.execute(query)
            return [{'id': row[0], 'label': row[1]}
                    for row in cursor.fetchall()]

        return jsonify({
            'categories': fetch_table("SELECT CategoryID, CategoryName FROM MemberCategory ORDER BY CategoryName"),
            'counties': fetch_table("SELECT CountyID, CountyName FROM IrishCounties ORDER BY CountyName"),
            'surnames': fetch_table("SELECT SurnameID, Surname FROM IrishSurnames ORDER BY Surname"),
            'occupations': fetch_table("SELECT OccupationID, OccupationName FROM Occupation ORDER BY OccupationName"),
            'societies': fetch_table("SELECT SocietyID, SocietyName FROM Society ORDER BY SocietyName")
        })
    except Exception as e:
        return jsonify({'error': f'Failed to fetch filters: {str(e)}'}), 500
    finally:
        conn.close()

# --- View Profile ---
@app.route('/api/lookups', methods=['GET'])
def get_lookups():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500
    try:
        cursor = conn.cursor()
        # Counties
        cursor.execute("SELECT [CountyID], [CountyName] FROM [IrishCounties] ORDER BY [CountyName]")
        counties = [{'id': row[0], 'name': row[1]} for row in cursor.fetchall()]
        # Categories
        cursor.execute("SELECT [CategoryID], [CategoryName] FROM [MemberCategory] ORDER BY [CategoryName]")
        categories = [{'id': row[0], 'name': row[1]} for row in cursor.fetchall()]
        # Fiscal Years
        cursor.execute("SELECT [FiscalYearID], [YearLabel] FROM [FiscalYear] ORDER BY [FiscalYearID] DESC")
        fiscalYears = [{'id': row[0], 'name': row[1]} for row in cursor.fetchall()]
        # Societies
        cursor.execute("SELECT [SocietyID], [SocietyName] FROM [Society] ORDER BY [SocietyName]")
        societies = [{'id': row[0], 'name': row[1]} for row in cursor.fetchall()]
        # Roles
        cursor.execute("SELECT [RoleID], [RoleName] FROM [Role] ORDER BY [RoleName]")
        roles = [{'id': row[0], 'name': row[1]} for row in cursor.fetchall()]
        return jsonify({
            'counties': counties,
            'categories': categories,
            'fiscalYears': fiscalYears,
            'societies': societies,
            'roles': roles
        })
    except Exception as e:
        return jsonify({'error': f'Failed to fetch lookups: {str(e)}'}), 500
    finally:
        conn.close()
@app.route('/api/lookups/counties', methods=['GET'])
def get_counties():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT CountyID, CountyName FROM IrishCounties ORDER BY CountyName")
        counties = [{'id': row[0], 'label': row[1]} for row in cursor.fetchall()]
        return jsonify(counties)
    except Exception as e:
        return jsonify({'error': f'Failed to fetch counties: {str(e)}'}), 500
    finally:
        conn.close()

@app.route('/api/lookups/categories', methods=['GET'])
def get_categories():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT CategoryID, CategoryName FROM MemberCategory ORDER BY CategoryName")
        categories = [{'id': row[0], 'label': row[1]} for row in cursor.fetchall()]
        return jsonify(categories)
    except Exception as e:
        return jsonify({'error': f'Failed to fetch categories: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/my-profile', methods=['GET'])
@auth_required  # All logged-in users can see their own profile
def get_my_profile():
    """Return account details for the logged-in user"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT UserID, Username, Email, Role, IsApproved, CreatedAt, LastLogin,
                   FirstName, [Last Name]
            FROM [User]
            WHERE UserID = ?
        """, (session['user_id'],))

        user = cursor.fetchone()
        if not user:
            logger.error(f"No user found for UserID: {session['user_id']}")
            return jsonify({'error': 'User not found'}), 404

        return jsonify({
            'id': user[0],
            'username': user[1],
            'email': user[2],
            'role': user[3],
            'isApproved': bool(user[4]),
            'createdDate': user[5].strftime('%Y-%m-%d') if user[5] else None,
            'lastLogin': user[6].strftime('%Y-%m-%d %H:%M') if user[6] else None,
            'firstName': user[7],
            'lastName': user[8]
        })
    except Exception as e:
        return jsonify({'error': f'Failed to fetch profile: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/forgot-password/manual', methods=['POST'])
def manual_password_reset():
    """Manual password reset using UserID (for users without email)"""
    data = request.get_json()
    user_id = data.get('userId')
    new_password = data.get('newPassword')
    confirm_password = data.get('confirmPassword')

    if not user_id or not new_password or not confirm_password:
        return jsonify({'error': 'All fields are required'}), 400

    if new_password != confirm_password:
        return jsonify({'error': 'Passwords do not match'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()

        # Check if user exists and has no email on record
        cursor.execute(
            "SELECT Username FROM [User] WHERE UserID = ? AND (Email IS NULL OR Email = '')",
            (user_id,
             ))
        result = cursor.fetchone()
        if not result:
            return jsonify(
                {'error': 'User not found or email is set. Use standard reset instead.'}), 404

        # Hash new password and update
        hashed = hash_password(new_password)
        cursor.execute("""
            UPDATE [User]
            SET PasswordHash = ?, ResetToken = NULL, ResetTokenExpires = NULL
            WHERE UserID = ?
        """, (hashed, user_id))
        conn.commit()

        log_audit_event(
            user_id,
            'MANUAL_PASSWORD_RESET',
            'User',
            user_id,
            'Manual password reset without email')

        return jsonify({'success': True,
                        'message': 'Password reset successful'})
    except Exception as e:
        return jsonify({'error': f'Reset failed: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/recognition-types', methods=['GET'])
@auth_required
def get_recognition_types():
    """List all recognition types"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT RecognitionTypeID, TypeName FROM RecognitionType ORDER BY TypeName")
        types = [{'id': row[0], 'name': row[1]} for row in cursor.fetchall()]
        return jsonify(types)
    except Exception as e:
        return jsonify({'error': f'Failed to fetch types: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/societies/<int:society_id>/recognitions', methods=['GET'])
@auth_required
def get_society_recognitions(society_id):
    """Get recognitions for a given society"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT r.RecognitionID, rt.TypeName, r.Description, fy.YearLabel, r.IsActive
            FROM Recognitions r
            JOIN RecognitionType rt ON r.RecognitionTypeID = rt.RecognitionTypeID
            LEFT JOIN FiscalYear fy ON r.FiscalYearID = fy.FiscalYearID
            WHERE r.SocietyID = ?
            ORDER BY fy.StartDate DESC
        """, (society_id,))
        data = [{
            'id': row[0],
            'type': row[1],
            'description': row[2],
            'fiscalYear': row[3],
            'isActive': row[4]
        } for row in cursor.fetchall()]
        return jsonify(data)
    except Exception as e:
        return jsonify(
            {'error': f'Failed to fetch recognitions: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/societies/<int:society_id>/recognitions', methods=['POST'])
@admin_required
def add_recognition(society_id):
    """Add recognition for a society"""
    data = request.get_json()
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO Recognitions (SocietyID, RecognitionTypeID, Description, FiscalYearID, IsActive)
            VALUES (?, ?, ?, ?, ?)
        """, (
            society_id,
            data.get('recognitionTypeId'),
            data.get('description'),
            data.get('fiscalYearId'),
            data.get('isActive', True)
        ))
        conn.commit()

        cursor.execute("SELECT @@IDENTITY")
        row = cursor.fetchone()
        rec_id = row[0] if row is not None else None
        if rec_id is None:
            return jsonify({'error': 'Failed to retrieve new recognition ID'}), 500

        log_audit_event(session['user_id'], 'CREATE', 'Recognition', rec_id,
                        f"Created recognition for society {society_id}")

        return jsonify({'success': True, 'id': rec_id}), 201
    except Exception as e:
        return jsonify(
            {'error': f'Failed to create recognition: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/recognitions/<int:recognition_id>', methods=['PUT'])
@admin_required
def update_recognition(recognition_id):
    """Update recognition"""
    data = request.get_json()
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE Recognitions
            SET RecognitionTypeID = ?, Description = ?, FiscalYearID = ?, IsActive = ?
            WHERE RecognitionID = ?
        """, (
            data.get('recognitionTypeId'),
            data.get('description'),
            data.get('fiscalYearId'),
            data.get('isActive'),
            recognition_id
        ))
        conn.commit()

        log_audit_event(
            session['user_id'],
            'UPDATE',
            'Recognition',
            recognition_id,
            'Updated recognition')

        return jsonify({'success': True})
    except Exception as e:
        return jsonify(
            {'error': f'Failed to update recognition: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/recognitions/<int:recognition_id>', methods=['DELETE'])
@admin_required
def delete_recognition(recognition_id):
    """Delete recognition"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM Recognitions WHERE RecognitionID = ?", (recognition_id,))
        conn.commit()

        log_audit_event(
            session['user_id'],
            'DELETE',
            'Recognition',
            recognition_id,
            'Deleted recognition')

        return jsonify({'success': True})
    except Exception as e:
        return jsonify(
            {'error': f'Failed to delete recognition: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/support', methods=['POST'])
@private_or_admin_required
def submit_support_message():
    """Submit a new support message (Private/Admin only)"""
    data = request.get_json()
    subject = data.get('subject')
    message = data.get('message')

    if not subject or not message:
        return jsonify({'error': 'Subject and message are required'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO Support (UserID, Subject, MessageBody, DateSubmitted, Status)
            VALUES (?, ?, ?, ?, ?)
        """, (
            session['user_id'],
            subject,
            message,
            datetime.now(),
            'New'
        ))
        conn.commit()

        # Get ID for audit log
        cursor.execute("SELECT @@IDENTITY")
        row = cursor.fetchone()
        support_id = row[0] if row is not None else None
        if support_id is None:
            return jsonify({'error': 'Failed to retrieve new support ID'}), 500

        log_audit_event(
            session['user_id'],
            'CREATE',
            'Support',
            support_id,
            f'Submitted support message: {subject}')
        return jsonify({'success': True, 'support_id': support_id})
    except Exception as e:
        return jsonify(
            {'error': f'Failed to submit support message: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/support', methods=['GET'])
@admin_required
def get_support_messages():
    """Get all submitted support messages (Admin only)"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.SupportID, s.UserID, u.Username, s.Subject, s.MessageBody,
                   s.DateSubmitted, s.Status
            FROM Support s
            LEFT JOIN [User] u ON s.UserID = u.UserID
            ORDER BY s.DateSubmitted DESC
        """)
        messages = []
        for row in cursor.fetchall():
            messages.append({
                'id': row[0],
                'userId': row[1],
                'username': row[2],
                'subject': row[3],
                'message': row[4],
                'submitted': row[5].strftime('%Y-%m-%d %H:%M:%S') if row[5] else None,
                'status': row[6]
            })
        return jsonify(messages)
    except Exception as e:
        return jsonify(
            {'error': f'Failed to fetch support messages: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/members/<int:member_id>/roles', methods=['GET'])
@auth_required
def get_member_roles(member_id):
    """Return all roles assigned to a member"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT mr.MemberRoleID, r.RoleName, fy.YearLabel
            FROM MemberRole mr
            JOIN Role r ON mr.RoleID = r.RoleID
            JOIN FiscalYear fy ON mr.FiscalYearID = fy.FiscalYearID
            WHERE mr.MemberID = ?
        """, (member_id,))
        roles = [{'id': row[0], 'role': row[1], 'fiscalYear': row[2]}
                 for row in cursor.fetchall()]
        return jsonify(roles)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/members/<int:member_id>/roles', methods=['POST'])
@admin_required
def add_member_role(member_id):
    data = request.get_json()
    role_id = data.get('roleId')
    fiscal_year_id = data.get('fiscalYearId')

    if not role_id or not fiscal_year_id:
        return jsonify({'error': 'Role and Fiscal Year are required'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO MemberRole (MemberID, RoleID, FiscalYearID)
            VALUES (?, ?, ?)
        """, (member_id, role_id, fiscal_year_id))
        conn.commit()

        log_audit_event(
            session['user_id'],
            'ASSIGN_ROLE',
            'MemberRole',
            member_id,
            f'RoleID={role_id}, FY={fiscal_year_id}')
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/members/<int:member_id>/roles/<int:member_role_id>',
           methods=['DELETE'])
@admin_required
def delete_member_role(member_id, member_role_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500
    try:
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM MemberRole WHERE MemberRoleID = ? AND MemberID = ?",
            (member_role_id,
             member_id))
        conn.commit()

        log_audit_event(
            session['user_id'],
            'DELETE_ROLE',
            'MemberRole',
            member_id,
            f'Deleted role assignment ID={member_role_id}')
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/members/<int:member_id>/fiscal-years', methods=['GET'])
@auth_required
def get_member_fiscal_years(member_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT mfy.MemberFiscalYearID, fy.YearLabel
            FROM MemberFiscalYear mfy
            JOIN FiscalYear fy ON mfy.FiscalYearID = fy.FiscalYearID
            WHERE mfy.MemberID = ?
        """, (member_id,))
        fy_data = [{'id': row[0], 'fiscalYear': row[1]}
                   for row in cursor.fetchall()]
        return jsonify(fy_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/members/<int:member_id>/fiscal-years', methods=['POST'])
@admin_required
def add_member_fiscal_year(member_id):
    data = request.get_json()
    fiscal_year_id = data.get('fiscalYearId')
    if not fiscal_year_id:
        return jsonify({'error': 'Fiscal Year ID is required'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO MemberFiscalYear (MemberID, FiscalYearID)
            VALUES (?, ?)
        """, (member_id, fiscal_year_id))
        conn.commit()

        log_audit_event(
            session['user_id'],
            'ADD_FISCAL_YEAR',
            'MemberFiscalYear',
            member_id,
            f'FY={fiscal_year_id}')
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/members/<int:member_id>/fiscal-years/<int:fy_link_id>',
           methods=['DELETE'])
@admin_required
def delete_member_fiscal_year(member_id, fy_link_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500
    try:
        cursor = conn.cursor()
        cursor.execute("""
            DELETE FROM MemberFiscalYear
            WHERE MemberFiscalYearID = ? AND MemberID = ?
        """, (fy_link_id, member_id))
        conn.commit()

        log_audit_event(
            session['user_id'],
            'DELETE_FISCAL_YEAR',
            'MemberFiscalYear',
            member_id,
            f'Deleted FY assignment ID={fy_link_id}')
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


def is_strong_password(pw):
    return bool(re.match(r'^(?=.*[A-Za-z])(?=.*\d).{8,}$', pw))


@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.json
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    firstName = data.get("firstName")
    lastName = data.get("lastName")
    email = data.get("email")
    password = data.get("password")
    confirm = data.get("confirmPassword")  # only used if you want double-check
    userID = data.get("userID")
    requestPrivate = data.get("requestPrivate", False)
    noEmail = data.get("noEmail", False)

    # BASIC VALIDATION
    if not firstName or not lastName:
        return jsonify({"message": "Name fields are required"}), 400

    if noEmail:
        if not userID:
            return jsonify({"message": "User ID is required if no email"}), 400
    else:
        if not email:
            return jsonify({"message": "Email is required"}), 400

    if not password:
        return jsonify({"message": "Password is required"}), 400

    if not is_strong_password(password):
        return jsonify(
            {"message": "Password must be at least 8 characters long and contain at least one number."}), 400

    # Hash the password before storing
    hashed_password = hash_password(password)

    # Connect to Access DB
    conn = pyodbc.connect(CONNECTION_STRING)
    cursor = conn.cursor()

    try:
        # Insert into [User] table (not Users)
        cursor.execute("""
            INSERT INTO [User] (Username, FirstName, [Last Name], Email, PasswordHash, Role, IsApproved, CreatedAt, Preferences)
            VALUES (?, ?, ?, ?, ?, ?, ?, Now(), ?)
        """, (
            firstName,        # Username (using firstName as requested)
            firstName,
            lastName,
            email if email else "",
            hashed_password,
            "public",
            True,            # IsApproved (auto-approve public users)
            ""                # Preferences (empty string)
        ))
        print("Inserted user:", firstName, lastName, email)
        conn.commit()
        return jsonify({"success": True, "message": "Signup successful!"})
    except Exception as e:
        conn.rollback()
        return jsonify({"message": "Signup failed", "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/support', methods=['POST'])
@auth_required
def submit_support():
    """Submit a support message (any logged-in user)"""
    data = request.get_json()
    subject = data.get('subject')
    message = data.get('messageBody')

    if not subject or not message:
        return jsonify({'error': 'Subject and message are required'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO Support (UserID, Subject, MessageBody, DateSubmitted, Status)
            VALUES (?, ?, ?, ?, ?)
        """, (session['user_id'], subject, message, datetime.now(), "Open"))
        conn.commit()
        return jsonify({'success': True,
                        'message': 'Support request submitted'})
    except Exception as e:
        return jsonify(
            {'error': f'Failed to submit support request: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/support', methods=['GET'])
@admin_required
def get_all_support_messages():
    """Admin: View all support messages"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.SupportID, u.Username, s.Subject, s.MessageBody, s.DateSubmitted, s.Status
            FROM Support s
            LEFT JOIN [User] u ON s.UserID = u.UserID
            ORDER BY s.DateSubmitted DESC
        """)
        results = []
        for row in cursor.fetchall():
            results.append({
                'id': row[0],
                'username': row[1],
                'subject': row[2],
                'messageBody': row[3],
                'dateSubmitted': row[4].strftime('%Y-%m-%d %H:%M') if row[4] else None,
                'status': row[5]
            })
        return jsonify(results)
    except Exception as e:
        return jsonify(
            {'error': f'Failed to fetch support messages: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/support/mine', methods=['GET'])
@auth_required
def get_my_support_messages():
    """Get support messages submitted by current user"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT SupportID, Subject, MessageBody, DateSubmitted, Status
            FROM Support
            WHERE UserID = ?
            ORDER BY DateSubmitted DESC
        """, (session['user_id'],))
        results = []
        for row in cursor.fetchall():
            results.append({
                'id': row[0],
                'subject': row[1],
                'messageBody': row[2],
                'dateSubmitted': row[3].strftime('%Y-%m-%d %H:%M') if row[3] else None,
                'status': row[4]
            })
        return jsonify(results)
    except Exception as e:
        return jsonify(
            {'error': f'Failed to fetch your support messages: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/support/<int:support_id>', methods=['PUT'])
@admin_required
def update_support_status(support_id):
    """Update support message status (Admin only)"""
    data = request.get_json()
    new_status = data.get('status')

    if not new_status:
        return jsonify({'error': 'Status is required'}), 400

    if new_status not in ['Open', 'Resolved', 'Closed']:
        return jsonify({'error': 'Invalid status'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT SupportID FROM Support WHERE SupportID = ?", (support_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Support message not found'}), 404

        cursor.execute("""
            UPDATE Support
            SET Status = ?
            WHERE SupportID = ?
        """, (new_status, support_id))
        conn.commit()

        log_audit_event(
            session['user_id'],
            'UPDATE_SUPPORT',
            'Support',
            support_id,
            f'Changed status to {new_status}')

        return jsonify({'success': True})
    except Exception as e:
        return jsonify(
            {'error': f'Failed to update support status: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/settings', methods=['GET'])
@admin_required
def get_settings():
    """Return all system settings (Admin only)"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()
        cursor.execute("SELECT SettingKey, SettingValue FROM Settings")
        settings = {row[0]: row[1] for row in cursor.fetchall()}
        return jsonify(settings)
    except Exception as e:
        return jsonify({'error': f'Failed to fetch settings: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/admin/settings', methods=['GET'])
@admin_required  
def get_admin_settings():
    """Return all system settings (Admin only) - alias for settings page"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        
        # Try to get settings, but provide defaults if table doesn't exist or is empty
        try:
            cursor.execute("SELECT SettingKey, SettingValue FROM Settings")
            settings_data = cursor.fetchall()
            settings = {row[0]: row[1] for row in settings_data}
        except:
            # If Settings table doesn't exist, return default settings
            settings = {}
        
        # Ensure we have some default settings
        default_settings = {
            'orgName': 'BIS Organization',
            'defaultAccess': 'public',
            'sessionTimeout': '60',
            'allowRegistration': 'true',
            'requireApproval': 'false',
            'maxMembers': '1000',
            'enableNotifications': 'true',
            'enableAuditLog': 'true'
        }
        
        # Merge defaults with existing settings
        for key, default_value in default_settings.items():
            if key not in settings:
                settings[key] = default_value
                
        return jsonify(settings)
    except Exception as e:
        return jsonify({'error': f'Failed to fetch settings: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/admin/settings', methods=['PUT'])
@admin_required
def update_admin_settings():
    """Update multiple system settings at once"""
    data = request.json
    if not data:
        return jsonify({'error': 'No settings data provided'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        
        for key, value in data.items():
            # Check if setting exists
            cursor.execute("SELECT SettingID FROM Settings WHERE SettingKey = ?", (key,))
            existing = cursor.fetchone()
            
            if existing:
                # Update existing setting
                cursor.execute("UPDATE Settings SET SettingValue = ? WHERE SettingKey = ?", (value, key))
            else:
                # Insert new setting
                cursor.execute("INSERT INTO Settings (SettingKey, SettingValue) VALUES (?, ?)", (key, value))
        
        conn.commit()
        return jsonify({'success': True, 'message': 'Settings updated successfully'})
    except Exception as e:
        return jsonify({'error': f'Failed to update settings: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/settings/<key>', methods=['PUT'])
@admin_required
def update_setting(key):
    """Update or create a setting by key (Admin only)"""
    data = request.get_json()
    value = data.get('value')

    if value is None:
        return jsonify({'error': 'Value is required'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()

        # Check if setting exists
        cursor.execute(
            "SELECT SettingID FROM Settings WHERE SettingKey = ?", (key,))
        if cursor.fetchone():
            # Update existing
            cursor.execute(
                "UPDATE Settings SET SettingValue = ? WHERE SettingKey = ?", (value, key))
        else:
            # Insert new
            cursor.execute(
                "INSERT INTO Settings (SettingKey, SettingValue) VALUES (?, ?)", (key, value))

        conn.commit()
        log_audit_event(
            session['user_id'],
            'UPDATE_SETTING',
            'Settings',
            key,
            f'Set to: {value}')
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': f'Failed to update setting: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/import/members/preview', methods=['POST'])
@admin_required
def import_members_preview():
    """Upload CSV and preview parsed member data"""
    if 'file' not in request.files:
        return jsonify({'error': 'CSV file is required'}), 400

    file = request.files['file']
    if not file or not file.filename:
        return jsonify({'error': 'Only CSV files are supported'}), 400

    try:
        stream = io.StringIO(file.stream.read().decode('utf-8'))
        reader = csv.DictReader(stream)
        preview_data = []
        errors = []

        conn = get_db_connection()
        cursor = conn.cursor()

        for i, row in enumerate(reader, start=1):
            row_errors = []

            # Required checks
            for field in ['FirstName', 'LastName', 'IsActive']:
                if not row.get(field):
                    row_errors.append(f"Missing {field}")

            # Date format check
            for date_field in ['DateOfBirth', 'DateJoined', 'DateEnded']:
                value = row.get(date_field)
                if value:
                    try:
                        datetime.strptime(value, '%Y-%m-%d')
                    except ValueError:
                        row_errors.append(f"{date_field} must be YYYY-MM-DD")

            # Duplicate check
            cursor.execute("""
                SELECT MemberID FROM Members
                WHERE FirstName = ? AND LastName = ? AND (Email = ? OR Email IS NULL)
            """, (row['FirstName'], row['LastName'], row.get('Email')))
            if cursor.fetchone():
                row_errors.append("Duplicate: already exists in database")

            # Lookup conversion
            category_id = get_lookup_id(
                conn,
                'MemberCategory',
                'CategoryName',
                row.get('MemberCategory'))
            county_id = get_lookup_id(
                conn, 'IrishCounties', 'CountyName', row.get('County'))
            society_id = get_lookup_id(
                conn, 'Society', 'SocietyName', row.get('Society'))

            if not category_id:
                row_errors.append("Unknown MemberCategory")
            if not county_id:
                row_errors.append("Unknown County")
            if row.get('Society') and not society_id:
                row_errors.append("Unknown Society")

            preview_data.append({
                'FirstName': row['FirstName'],
                'LastName': row['LastName'],
                'Email': row.get('Email'),
                'PhoneNumber': row.get('PhoneNumber'),
                'PlaceOfBirth': row.get('PlaceOfBirth'),
                'DateOfBirth': row.get('DateOfBirth'),
                'DateJoined': row.get('DateJoined'),
                'DateEnded': row.get('DateEnded'),
                'MemberCategoryID': category_id,
                'CountyID': county_id,
                'SocietyID': society_id,
                'IsActive': (row.get('IsActive') or '').strip().lower() == 'true'
            })

            if row_errors:
                errors.append(f"Row {i}: " + "; ".join(row_errors))

        conn.close()
        return jsonify({'preview': preview_data, 'errors': errors})
    except Exception as e:
        return jsonify({'error': f'Failed to parse CSV: {str(e)}'}), 500


@app.route('/api/import/members/confirm', methods=['POST'])
@admin_required
def import_members_confirm():
    """Finalizes import of validated members"""
    data = request.get_json()
    rows = data.get('members')

    if not rows or not isinstance(rows, list):
        return jsonify({'error': 'Invalid member data'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    inserted = 0
    errors = []

    try:
        cursor = conn.cursor()
        for i, row in enumerate(rows, start=1):
            try:
                cursor.execute(
                    """
                    INSERT INTO Members (
                        FirstName, LastName, Email, PhoneNumber,
                        PlaceOfBirth, DateOfBirth, DateJoined, DateEnded,
                        MemberCategoryID, CountyID, SocietyID, IsActive
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                    (row.get('FirstName'),
                     row.get('LastName'),
                        row.get('Email'),
                        row.get('PhoneNumber'),
                        row.get('PlaceOfBirth'),
                        row.get('DateOfBirth'),
                        row.get('DateJoined'),
                        row.get('DateEnded'),
                        row.get('MemberCategoryID'),
                        row.get('CountyID'),
                        row.get('SocietyID'),
                        True if row.get(
                        'IsActive',
                        '').lower() == 'true' else False))
                inserted += 1
            except Exception as row_err:
                errors.append(f"Row {i}: {str(row_err)}")

        conn.commit()
        return jsonify(
            {'success': True, 'inserted': inserted, 'errors': errors})
    except Exception as e:
        return jsonify({'error': f'Failed to import members: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/import/members/template', methods=['GET'])
@admin_required
def download_member_csv_template():
    """Download blank CSV import template"""
    headers = [
        'FirstName', 'LastName', 'Email', 'PhoneNumber',
        'PlaceOfBirth', 'DateOfBirth', 'DateJoined', 'DateEnded',
        'MemberCategory', 'County', 'Society', 'IsActive'
    ]

    stream = io.StringIO()
    writer = csv.writer(stream)
    writer.writerow(headers)
    response = Response(stream.getvalue(), mimetype='text/csv')
    response.headers.set(
        "Content-Disposition",
        "attachment",
        filename="member_import_template.csv")
    return response


def get_lookup_id(conn, table, name_column, value):
    cursor = conn.cursor()
    cursor.execute(
        f"SELECT {table}ID FROM {table} WHERE {name_column} = ?", (value,))
    row = cursor.fetchone()
    return row[0] if row else None


@app.route('/api/export/recognitions/csv', methods=['GET'])
@admin_required
def export_recognitions_csv():
    """Export all recognition records to CSV (Admin only)"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT
                r.RecognitionID,
                s.SocietyName AS Society,
                rt.TypeName AS RecognitionType,
                s.SocietyName,
                fy.YearLabel,
                r.Description,
                r.IsActive
            FROM Recognitions r
            LEFT JOIN RecognitionType rt ON r.RecognitionTypeID = rt.RecognitionTypeID
            LEFT JOIN Society s ON r.SocietyID = s.SocietyID
            LEFT JOIN FiscalYear fy ON r.FiscalYearID = fy.FiscalYearID
            ORDER BY fy.YearLabel DESC, s.SocietyName
        """)

        stream = io.StringIO()
        writer = csv.writer(stream)
        writer.writerow(['RecognitionID',
                         'Society',
                         'RecognitionType',
                         'Society',
                         'FiscalYear',
                         'Description',
                         'IsActive'])

        for row in cursor.fetchall():
            writer.writerow(row)

        response = Response(stream.getvalue(), mimetype='text/csv')
        response.headers.set(
            "Content-Disposition",
            "attachment",
            filename="recognitions_export.csv")
        return response

    except Exception as e:
        return jsonify(
            {'error': f'Failed to export recognitions: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/about', methods=['GET'])
def get_about_info():
    """Public system info endpoint (no auth required)"""
    conn = get_db_connection()
    org_name = "Membership System"

    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT SettingValue FROM Settings WHERE SettingKey = 'OrgName'")
        row = cursor.fetchone()
        if row and row[0]:
            org_name = row[0]
    except BaseException:
        pass  # fallback to default if settings table is unavailable
    finally:
        if conn:
            conn.close()

    return jsonify({
        'system': 'BIS Membership System',
        'version': '1.0.0',
        'organization': org_name,
        'copyright': '© 2025',
        'last_updated': '2025-07-02'
    })


@app.route('/api/system-status', methods=['GET'])
def system_status():
    """Simple health check endpoint"""
    try:
        conn = get_db_connection()
        if not conn:
            raise Exception("No DB connection")

        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()

        return jsonify({
            'status': 'OK',
            'database': 'Connected',
            'time': datetime.utcnow().isoformat() + 'Z'
        })
    except Exception as e:
        return jsonify({
            'status': 'ERROR',
            'database': 'Unavailable',
            'error': str(e)
        }), 503
    finally:
        if conn:
            conn.close()


@app.route('/api/import/recognitions/preview', methods=['POST'])
@admin_required
def import_recognitions_preview():
    """Upload CSV and preview parsed recognition data (Society-level)"""
    if 'file' not in request.files:
        return jsonify({'error': 'CSV file is required'}), 400

    file = request.files['file']
    if not file or not file.filename:
        return jsonify({'error': 'Only CSV files are supported'}), 400

    try:
        stream = io.StringIO(file.stream.read().decode('utf-8'))
        reader = csv.DictReader(stream)
        preview_data = []
        errors = []

        conn = get_db_connection()

        for i, row in enumerate(reader, start=1):
            row_errors = []

            # Required fields
            if not row.get('RecognitionType'):
                row_errors.append("Missing RecognitionType")
            if not row.get('Society'):
                row_errors.append("Missing Society")
            if not row.get('IsActive'):
                row_errors.append("Missing IsActive")

            # Lookups
            type_id = get_lookup_id(
                conn,
                'RecognitionType',
                'TypeName',
                row.get('RecognitionType'))
            society_id = get_lookup_id(
                conn, 'Society', 'SocietyName', row.get('Society'))
            fiscal_id = get_lookup_id(conn, 'FiscalYear', 'YearLabel', row.get(
                'FiscalYear')) if row.get('FiscalYear') else None

            if not type_id:
                row_errors.append("Unknown RecognitionType")
            if not society_id:
                row_errors.append("Unknown Society")
            if row.get('FiscalYear') and not fiscal_id:
                row_errors.append("Unknown FiscalYear")

            preview_data.append({
                'RecognitionTypeID': type_id,
                'SocietyID': society_id,
                'FiscalYearID': fiscal_id,
                'Description': row.get('Description'),
                'IsActive': (row.get('IsActive') or '').strip().lower() == 'true'
            })

            if row_errors:
                errors.append(f"Row {i}: " + "; ".join(row_errors))

        conn.close()
        return jsonify({'preview': preview_data, 'errors': errors})
    except Exception as e:
        return jsonify({'error': f'Failed to parse CSV: {str(e)}'}), 500


@app.route('/api/import/recognitions/confirm', methods=['POST'])
@admin_required
def import_recognitions_confirm():
    """Finalize import of society recognitions"""
    data = request.get_json()
    rows = data.get('recognitions')

    if not rows or not isinstance(rows, list):
        return jsonify({'error': 'Invalid recognition data'}), 400

    conn = get_db_connection()
    inserted = 0
    errors = []

    try:
        cursor = conn.cursor()
        for i, row in enumerate(rows, start=1):
            try:
                cursor.execute("""
                    INSERT INTO Recognitions (
                        RecognitionTypeID, SocietyID, FiscalYearID,
                        Description, IsActive
                    ) VALUES (?, ?, ?, ?, ?)
                """, (
                    row.get('RecognitionTypeID'),
                    row.get('SocietyID'),
                    row.get('FiscalYearID'),
                    row.get('Description'),
                    row.get('IsActive')
                ))
                inserted += 1
            except Exception as row_err:
                errors.append(f"Row {i}: {str(row_err)}")

        conn.commit()
        return jsonify(
            {'success': True, 'inserted': inserted, 'errors': errors})
    except Exception as e:
        return jsonify(
            {'error': f'Failed to import recognitions: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/export/recognitions/template', methods=['GET'])
@admin_required
def download_recognition_csv_template():
    headers = [
        'RecognitionType',
        'Society',
        'FiscalYear',
        'Description',
        'IsActive']

    stream = io.StringIO()
    writer = csv.writer(stream)
    writer.writerow(headers)
    response = Response(stream.getvalue(), mimetype='text/csv')
    response.headers.set(
        "Content-Disposition",
        "attachment",
        filename="recognitions_template.csv")
    return response


@app.route('/api/audit-log', methods=['GET'])
@admin_required
def get_audit_log():
    """Admin: View audit log entries with user info"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT a.AuditID, a.UserID, u.Username, a.Entity, a.EntityID, a.Action, a.Details, a.Timestamp
            FROM AuditLog a
            LEFT JOIN [User] u ON a.UserID = u.UserID
            ORDER BY a.Timestamp DESC
        """)
        results = []
        for row in cursor.fetchall():
            results.append({
                'auditID': row[0],
                'userID': row[1],
                'username': row[2],
                'entity': row[3],
                'entityID': row[4],
                'action': row[5],
                'details': row[6],
                'timestamp': row[7].strftime('%Y-%m-%d %H:%M:%S') if row[7] else None
            })

        return jsonify(results)
    except Exception as e:
        return jsonify({'error': f'Failed to fetch audit log: {str(e)}'}), 500
    finally:
        conn.close()


@app.route("/api/public/dashboard")
def get_public_dashboard():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Total number of members
        cursor.execute("SELECT COUNT(*) FROM Members")
        row = cursor.fetchone()
        total = row[0] if row is not None else 0

        # Membership Categories
        cursor.execute("""
            SELECT mc.CategoryName, COUNT(m.MemberID)
            FROM Members m
            LEFT JOIN MemberCategory mc ON m.MemberCategoryID = mc.CategoryID
            GROUP BY mc.CategoryName
        """)
        categories = [{"name": row[0] if row[0] else "Unknown", "value": row[1]}
                    for row in cursor.fetchall()]

        # Top 10 counties
        cursor.execute("""
            SELECT ic.CountyName, COUNT(m.MemberID)
            FROM Members m
            LEFT JOIN IrishCounties ic ON m.CountyID = ic.CountyID
            GROUP BY ic.CountyName
            ORDER BY COUNT(m.MemberID) DESC
        """)
        regions = [{"name": row[0] if row[0] else "Unknown", "value": row[1]}
                for row in cursor.fetchall()[:10]]

        # Historical summary
        cursor.execute("SELECT MIN(DateJoined) FROM Members")
        row = cursor.fetchone()
        first_date = row[0] if row is not None else None
        first_year = first_date.year if first_date else None

        cursor.execute("""
            SELECT TOP 1 YEAR(DateJoined) AS Yr, COUNT(*) AS Total
            FROM Members
            WHERE DateJoined IS NOT NULL
            GROUP BY YEAR(DateJoined)
            ORDER BY COUNT(*) DESC
        """)
        peak = cursor.fetchone()
        peak_count = peak[1] if peak else 0

        cursor.execute("SELECT COUNT(*) FROM Members WHERE IsActive = TRUE")
        row = cursor.fetchone()
        lifetime = row[0] if row is not None else 0

        return jsonify({
            "totalMembers": total,
            "categories": categories,
            "regions": regions,
            "historical": {
                "firstRegistered": first_year,
                "mostInAYear": peak_count,
                "lifetime": lifetime
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@app.route("/api/members/<int:member_id>/reinstate", methods=["POST"])
@admin_required
def reinstate_member(member_id):
    """Reinstate an inactive member (Admin only)"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        
        # Check if member exists
        cursor.execute("SELECT FirstName, LastName FROM Members WHERE MemberID = ?", (member_id,))
        member = cursor.fetchone()
        if not member:
            return jsonify({'error': 'Member not found'}), 404
        
        # Reinstate member
        cursor.execute("UPDATE Members SET IsActive = True, DateEnded = NULL WHERE MemberID = ?", 
                      (member_id,))
        conn.commit()
        
        # Log audit event
        log_audit_event(
            session['user_id'],
            'REINSTATE',
            'Members',
            member_id,
            f'Reinstated member: {member[0]} {member[1]}'
        )
        
        return jsonify({"success": True, "message": "Member reinstated successfully"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()


@app.route("/api/members/<int:member_id>/deactivate", methods=["POST"])
@admin_required
def deactivate_member(member_id):
    """Deactivate an active member (Admin only)"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        
        # Check if member exists
        cursor.execute("SELECT FirstName, LastName FROM Members WHERE MemberID = ?", (member_id,))
        member = cursor.fetchone()
        if not member:
            return jsonify({'error': 'Member not found'}), 404
        
        # Deactivate member
        cursor.execute("UPDATE Members SET IsActive = False, DateEnded = ? WHERE MemberID = ?", 
                      (datetime.now(), member_id))
        conn.commit()
        
        # Log audit event
        log_audit_event(
            session['user_id'],
            'DEACTIVATE',
            'Members',
            member_id,
            f'Deactivated member: {member[0]} {member[1]}'
        )
        
        return jsonify({"success": True, "message": "Member deactivated successfully"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()


@app.route("/api/members/bulk-deactivate", methods=["PUT"])
def bulk_deactivate_members():
    data = request.json
    if not data:
        return jsonify(success=False, message="No data provided"), 400
    ids = data.get("ids", [])
    if not ids:
        return jsonify(success=False, message="No IDs provided"), 400
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    cursor = conn.cursor()
    q = f"UPDATE Members SET IsActive = False WHERE MemberID IN ({','.join(['?'] * len(ids))})"
    cursor.execute(q, ids)
    conn.commit()
    conn.close()
    return jsonify(success=True)


# --- Error Handlers ---
@app.errorhandler(403)
def access_denied(e):
    return jsonify({
        'error': 'Access Denied',
        'message': 'You do not have permission to access this resource.'
    }), 403


@app.errorhandler(404)
def not_found(e):
    return jsonify({
        'error': 'Not Found',
        'message': 'The requested resource could not be found.'
    }), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({
        'error': 'Server Error',
        'message': 'An unexpected error occurred. Please try again later.'
    }), 500


@app.route('/api/admin/dashboard', methods=['GET'])
@admin_required
def admin_dashboard():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        # Copy logic from get_dashboard
        # Basic stats
        cursor.execute("SELECT COUNT(*) FROM Members WHERE IsActive = True")
        row = cursor.fetchone()
        active_members = row[0] if row is not None else 0
        cursor.execute("SELECT COUNT(*) FROM Members WHERE IsActive = False")
        row = cursor.fetchone()
        inactive_members = row[0] if row is not None else 0
        cursor.execute("SELECT COUNT(*) FROM Society")
        row = cursor.fetchone()
        total_societies = row[0] if row is not None else 0
        cursor.execute("SELECT COUNT(*) FROM [User] WHERE IsApproved = True")
        row = cursor.fetchone()
        active_users = row[0] if row is not None else 0
        # Recent members (last 30 days)
        cursor.execute("""
            SELECT FirstName, LastName, DateJoined
            FROM Members
            WHERE DateJoined >= ? AND DateJoined <= ?
            ORDER BY DateJoined DESC
        """, (datetime.now() - timedelta(days=30), datetime.now()))
        recent_members = [
            {
                'name': f"{row[0]} {row[1]}",
                'date': row[2].strftime('%Y-%m-%d') if row[2] else None
            }
            for row in cursor.fetchall()
        ]
        # Compose stats
        stats = {
            'activeMembers': active_members,
            'inactiveMembers': inactive_members,
            'totalSocieties': total_societies,
            'activeUsers': active_users,
        }
        
        # Get actual admin user info from database
        cursor.execute("""
            SELECT FirstName, [Last Name], Username
            FROM [User]
            WHERE UserID = ?
        """, (session['user_id'],))
        
        admin_data = cursor.fetchone()
        if admin_data:
            admin_user = {
                'firstName': admin_data[0] or 'Admin',
                'lastName': admin_data[1] or '',
                'username': admin_data[2] or 'admin'
            }
        else:
            admin_user = {
                'firstName': 'Admin',
                'lastName': '',
                'username': 'admin'
            }
            
        return jsonify({
            'stats': stats,
            'recentActivities': recent_members,
            'adminUser': admin_user,
        })
    except Exception as e:
        return jsonify(
            {'error': f'Failed to fetch admin dashboard: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/admin/stats', methods=['GET'])
@admin_required
def admin_stats():
    # This is a placeholder. You should replace with real queries as needed.
    # The frontend expects: { total, growth, breakdown: {active, inactive,
    # deceased}, yearly: {year: count, ...} }
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        # Total members
        cursor.execute("SELECT COUNT(*) FROM Members")
        row = cursor.fetchone()
        total = row[0] if row is not None else 0
        # Active
        cursor.execute("SELECT COUNT(*) FROM Members WHERE IsActive = True")
        row = cursor.fetchone()
        active_members = row[0] if row is not None else 0

        cursor.execute("SELECT COUNT(*) FROM Members WHERE IsActive = False")
        row = cursor.fetchone()
        inactive_members = row[0] if row is not None else 0

        cursor.execute("SELECT COUNT(*) FROM Society")
        row = cursor.fetchone()
        total_societies = row[0] if row is not None else 0

        cursor.execute("SELECT COUNT(*) FROM [User] WHERE IsApproved = True")
        row = cursor.fetchone()
        active_users = row[0] if row is not None else 0

        # Recent members (last 30 days)
        cursor.execute("""
            SELECT COUNT(*) FROM Members
            WHERE DateJoined >= ? AND DateJoined <= ?
        """, (datetime.now() - timedelta(days=30), datetime.now()))
        row = cursor.fetchone()
        recent_members = row[0] if row is not None else 0

        # Pending approvals
        cursor.execute("SELECT COUNT(*) FROM [User] WHERE IsApproved = False")
        row = cursor.fetchone()
        pending_approvals = row[0] if row is not None else 0

        # Yearly breakdown (last 5 years)
        yearly = {}
        for y in range(datetime.now().year - 4, datetime.now().year + 1):
            cursor.execute(
                "SELECT COUNT(*) FROM Members WHERE YEAR(DateJoined) = ?", (y,))
            row = cursor.fetchone()
            yearly[str(y)] = row[0] if row is not None else 0
        # Growth (dummy calc)
        growth = 0
        if yearly:
            years = sorted(yearly.keys())
            if len(years) > 1 and yearly[years[0]]:
                growth = int(
                    100 * (yearly[years[-1]] - yearly[years[0]]) / yearly[years[0]])
        return jsonify({
            'total': total,
            'growth': growth,
            'breakdown': {'active': active_members, 'inactive': inactive_members, 'deceased': 0},
            'yearly': yearly
        })
    except Exception as e:
        return jsonify({'error': f'Failed to fetch stats: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/debug/dbtest', methods=['GET'])
def debug_dbtest():
    """Debug endpoint to test Access DB table/field access step by step."""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    cursor = conn.cursor()
    results = {}
    # Test Members table
    try:
        cursor.execute("SELECT MemberID, FirstName, LastName FROM Members")
        results['Members'] = [list(row) for row in cursor.fetchall()]
    except Exception as e:
        results['Members'] = f"Error: {str(e)}"
    # Test MemberCategory table
    try:
        cursor.execute("SELECT CategoryID, CategoryName FROM MemberCategory")
        results['MemberCategory'] = [list(row) for row in cursor.fetchall()]
    except Exception as e:
        results['MemberCategory'] = f"Error: {str(e)}"
    # Test User table
    try:
        cursor.execute("SELECT UserID, Username FROM [User]")
        results['User'] = [list(row) for row in cursor.fetchall()]
    except Exception as e:
        results['User'] = f"Error: {str(e)}"
    conn.close()
    return jsonify(results)


# User access request endpoints removed - no RequestPrivate field in database


if __name__ == '__main__':
    app.run(debug=True, port=5000, host='localhost')
