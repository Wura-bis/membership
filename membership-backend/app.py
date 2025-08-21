

# --- Create & Get Fiscal Years Lookup ---
# Place this after app = Flask(__name__)
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
import sqlite3
import hashlib
from datetime import datetime, timedelta
from functools import wraps
import os
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import base64

def format_date_for_frontend(date_value):
    """Format date for frontend HTML date inputs (yyyy-MM-dd format only)"""
    if not date_value:
        return None
    
    # If it's a datetime object, use strftime
    if hasattr(date_value, 'strftime'):
        return date_value.strftime('%Y-%m-%d')
    
    # If it's a string, extract just the date part
    if isinstance(date_value, str):
        # Split on space to remove time component if present
        date_part = date_value.split(' ')[0]
        # Validate it's in the right format
        try:
            datetime.strptime(date_part, '%Y-%m-%d')
            return date_part
        except ValueError:
            return str(date_value)
    
    return str(date_value)
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
    reportlab_letter = None  # type: ignore
    reportlab_canvas = None  # type: ignore
import zipfile
import logging
try:
    from werkzeug.security import check_password_hash
except ImportError:
    def check_password_hash(pwhash: str, password: str) -> bool:
        return pwhash == hashlib.sha256(password.encode()).hexdigest()

import secrets

# Configuration/constants
DATABASE_PATH = os.path.join(os.path.dirname(__file__), '..', 'BISMembershipDatabase.db')
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
SESSION_TIMEOUT = 7200  # 2 hours (instead of 30 minutes)
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
    """Check if session has timed out - optimized"""
    if 'last_activity' not in session:
        return True
    
    # Check timeout less frequently for better performance
    now = datetime.now().timestamp()
    if now - session['last_activity'] > SESSION_TIMEOUT:
        session.clear()
        return True
    
    # Update activity timestamp only every 5 minutes to reduce session writes
    if now - session['last_activity'] > 300:  # 5 minutes
        session['last_activity'] = now
    
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
    """Get dashboard statistics for the private dashboard - cached version"""
    cache_key = f"dashboard_stats_{datetime.now().strftime('%Y-%m-%d-%H')}"  # Cache for 1 hour
    
    # Simple in-memory cache check
    if hasattr(dashboard_stats, 'cache') and cache_key in dashboard_stats.cache:
        return jsonify(dashboard_stats.cache[cache_key])
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get total members count
        cursor.execute("SELECT COUNT(*) FROM Members")
        total_members = cursor.fetchone()[0]
        
        # Get active members 
        cursor.execute("SELECT COUNT(*) FROM Members WHERE IsActive = 1")
        active_members = cursor.fetchone()[0]
        
        # Get new members this month
        cursor.execute("SELECT COUNT(*) FROM Members WHERE DateJoined >= ?", (datetime.now().replace(day=1).strftime('%Y-%m-%d'),))
        new_this_month = cursor.fetchone()[0]
        
        conn.close()
        
        stats = {
            'totalMembers': total_members,
            'activeMembers': active_members,
            'newThisMonth': new_this_month
        }
        
        # Cache the results
        if not hasattr(dashboard_stats, 'cache'):
            dashboard_stats.cache = {}
        dashboard_stats.cache[cache_key] = stats
        
        # Clean old cache entries (keep only current hour)
        current_hour_key = cache_key
        dashboard_stats.cache = {k: v for k, v in dashboard_stats.cache.items() if k == current_hour_key}
        
        return jsonify(stats)
        
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
        
        # Validate priority
        valid_priorities = ['normal', 'high', 'urgent']
        if priority not in valid_priorities:
            priority = 'normal'
        
        # Store in database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO SupportTickets (UserID, Subject, Message, Priority, Status, DateCreated)
            VALUES (?, ?, ?, ?, 'open', NOW())
        """, (user_id, subject, message, priority))
        
        conn.commit()
        
        # Get the auto-generated TicketID using @@IDENTITY (Access equivalent)
        cursor.execute("SELECT @@IDENTITY")
        ticket_id = cursor.fetchone()[0]
        
        # Get user details for email
        cursor.execute("SELECT Username, Email FROM User WHERE UserID = ?", (user_id,))
        user_row = cursor.fetchone()
        
        if user_row:
            user_name = user_row[0]
            user_email = user_row[1]
        else:
            user_name = f"User {user_id}"
            user_email = "unknown@example.com"
        
        conn.close()
        
        # Send email notification to admin(s)
        try:
            admin_emails = ['admin@bis.com']  # Configure your admin email(s)
            priority_label = priority.upper() if priority != 'normal' else ''
            
            subject_line = f"[SUPPORT TICKET #{ticket_id}] {priority_label} {subject}".strip()
            
            email_body = f"""
New Support Ticket Submitted

Ticket ID: #{ticket_id}
Priority: {priority.upper()}
Submitted by: {user_name} ({user_email})
Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

Subject: {subject}

Message:
{message}

---
Please log in to the admin panel to respond to this ticket.
            """.strip()
            
            for admin_email in admin_emails:
                send_email(admin_email, subject_line, email_body)
                
        except Exception as email_error:
            logger.error(f"Failed to send support ticket email: {email_error}")
            # Don't fail the request if email fails
        
        logger.info(f"Support ticket #{ticket_id} created by user {user_id}: {subject} - {priority}")
        
        return jsonify({
            'success': True,
            'message': f'Support request submitted successfully! Ticket ID: #{ticket_id}',
            'ticket_id': ticket_id
        })
        
    except Exception as e:
        logger.error(f"Error submitting support request: {e}")
        return jsonify({'error': 'Failed to submit support request'}), 500


@app.route('/api/admin/support/tickets', methods=['GET'])
@admin_required
def get_support_tickets():
    """Get all support tickets for admin management"""
    try:
        status_filter = request.args.get('status', 'all')
        priority_filter = request.args.get('priority', 'all')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # First, check if the table exists by trying a simple query
        try:
            cursor.execute("SELECT COUNT(*) FROM SupportTickets")
            cursor.fetchone()
        except Exception as table_error:
            conn.close()
            logger.error(f"SupportTickets table does not exist or has issues: {table_error}")
            return jsonify({
                'error': 'SupportTickets table not found. Please create the table first.',
                'sql_error': str(table_error)
            }), 500
        
        # Build query with filters
        base_query = """
            SELECT st.TicketID, st.UserID, st.Subject, st.Message, st.Priority, 
                   st.Status, st.DateCreated, st.DateUpdated, st.AdminResponse,
                   u.Username, u.Email
            FROM SupportTickets st
            LEFT JOIN User u ON st.UserID = u.UserID
        """
        
        where_conditions = []
        params = []
        
        if status_filter != 'all':
            where_conditions.append("st.Status = ?")
            params.append(status_filter)
        
        if priority_filter != 'all':
            where_conditions.append("st.Priority = ?")
            params.append(priority_filter)
        
        if where_conditions:
            query = base_query + " WHERE " + " AND ".join(where_conditions)
        else:
            query = base_query
        
        query += " ORDER BY st.DateCreated DESC"
        
        logger.info(f"Executing query: {query} with params: {params}")
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        tickets = []
        for row in rows:
            tickets.append({
                'ticket_id': row[0],
                'user_id': row[1],
                'subject': row[2],
                'message': row[3],
                'priority': row[4],
                'status': row[5],
                'date_created': row[6].isoformat() if row[6] and hasattr(row[6], 'isoformat') else str(row[6]) if row[6] else None,
                'date_updated': row[7].isoformat() if row[7] and hasattr(row[7], 'isoformat') else str(row[7]) if row[7] else None,
                'admin_response': row[8],
                'user_name': row[9] if row[9] else f"User {row[1]}",
                'user_email': row[10] if row[10] else 'no-email@example.com'
            })
        
        conn.close()
        
        return jsonify({
            'success': True,
            'tickets': tickets,
            'total': len(tickets)
        })
        
    except Exception as e:
        logger.error(f"Error fetching support tickets: {e}")
        return jsonify({'error': 'Failed to fetch support tickets', 'details': str(e)}), 500


@app.route('/api/admin/support/tickets/<int:ticket_id>', methods=['PUT'])
@admin_required
def update_support_ticket(ticket_id):
    """Update support ticket status and add admin response"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid input data'}), 400
        
        status = data.get('status')
        admin_response = data.get('admin_response', '').strip()
        admin_user_id = session.get('user_id')
        
        # Validate status
        valid_statuses = ['open', 'in-progress', 'resolved', 'closed']
        if status and status not in valid_statuses:
            return jsonify({'error': 'Invalid status'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Simplified approach - build a complete query matching the actual table structure
        from datetime import datetime
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        # Use the correct column names from the actual table structure
        query = """
            UPDATE SupportTickets 
            SET Status = ?, AdminResponse = ?, AdminID = ?, DateUpdated = ?
            WHERE TicketID = ?
        """
        
        params = [
            status if status else 'open',
            admin_response if admin_response else '',
            admin_user_id if admin_user_id else None,
            current_time,
            ticket_id
        ]
        
        # Debug logging
        logger.info(f"Update query: {query.strip()}")
        logger.info(f"Parameters: {params}")
        logger.info(f"Parameter count: {len(params)}")
        
        cursor.execute(query, params)
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'error': 'Ticket not found'}), 404
        
        conn.commit()
        conn.close()
        
        logger.info(f"Support ticket #{ticket_id} updated by admin {admin_user_id}")
        
        return jsonify({
            'success': True,
            'message': f'Ticket #{ticket_id} updated successfully'
        })
        
    except Exception as e:
        logger.error(f"Error updating support ticket: {e}")
        return jsonify({'error': 'Failed to update support ticket'}), 500


@app.route('/api/support/my-tickets', methods=['GET'])
@private_or_admin_required
def get_my_support_tickets():
    """Get current user's support tickets"""
    try:
        user_id = session.get('user_id')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT TicketID, Subject, Message, Priority, Status, DateCreated, 
                   DateUpdated, AdminResponse
            FROM SupportTickets
            WHERE UserID = ?
            ORDER BY DateCreated DESC
        """, (user_id,))
        
        rows = cursor.fetchall()
        
        tickets = []
        for row in rows:
            tickets.append({
                'ticket_id': row[0],
                'subject': row[1],
                'message': row[2],
                'priority': row[3],
                'status': row[4],
                'date_created': row[5].isoformat() if row[5] and hasattr(row[5], 'isoformat') else str(row[5]) if row[5] else None,
                'date_updated': row[6].isoformat() if row[6] and hasattr(row[6], 'isoformat') else str(row[6]) if row[6] else None,
                'admin_response': row[7]
            })
        
        conn.close()
        
        return jsonify({
            'success': True,
            'tickets': tickets
        })
        
    except Exception as e:
        logger.error(f"Error fetching user support tickets: {e}")
        return jsonify({'error': 'Failed to fetch your support tickets'}), 500


@app.route('/api/admin/support/create-table', methods=['POST'])
@admin_required
def create_support_table():
    """Create the SupportTickets table if it doesn't exist"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Create the SupportTickets table
        create_table_sql = """
        CREATE TABLE SupportTickets (
            TicketID AUTOINCREMENT PRIMARY KEY,
            UserID INTEGER,
            Subject TEXT(255) NOT NULL,
            Message MEMO NOT NULL,
            Priority TEXT(50) DEFAULT 'normal',
            Status TEXT(50) DEFAULT 'open',
            DateCreated DATETIME DEFAULT NOW(),
            DateUpdated DATETIME,
            AdminResponse MEMO,
            AdminUserID INTEGER
        )
        """
        
        cursor.execute(create_table_sql)
        conn.commit()
        conn.close()
        
        logger.info("SupportTickets table created successfully")
        
        return jsonify({
            'success': True,
            'message': 'SupportTickets table created successfully'
        })
        
    except Exception as e:
        logger.error(f"Error creating SupportTickets table: {e}")
        return jsonify({
            'error': 'Failed to create SupportTickets table',
            'details': str(e)
        }), 500

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
    """Log audit events - optimized version"""
    conn = get_db_connection()
    if not conn:
        return

    try:
        cursor = conn.cursor()
        # Direct insert without trying to create table every time
        cursor.execute("""
            INSERT INTO AuditLog (UserID, Action, TableName, RecordID, Details, Timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (user_id, action, table_name, record_id, details or '', datetime.now()))
        conn.commit()
    except Exception as e:
        # If table doesn't exist, create it once and retry
        if "doesn't exist" in str(e).lower() or "not found" in str(e).lower():
            try:
                cursor.execute("""
                    CREATE TABLE AuditLog (
                        ID AUTOINCREMENT PRIMARY KEY,
                        UserID LONG,
                        Action TEXT(50),
                        TableName TEXT(50),
                        RecordID LONG,
                        Details MEMO,
                        Timestamp DATETIME
                    )
                """)
                conn.commit()
                # Retry the insert
                cursor.execute("""
                    INSERT INTO AuditLog (UserID, Action, TableName, RecordID, Details, Timestamp)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (user_id, action, table_name, record_id, details or '', datetime.now()))
                conn.commit()
                logger.info("Created AuditLog table and logged event")
            except Exception as create_error:
                logger.error(f"Failed to create AuditLog table and log event: {create_error}")
        else:
            logger.error(f"Audit logging failed: {e}")
    finally:
        conn.close()


def log_audit_event_async(user_id, action, table_name, record_id, details=None):
    """Non-blocking audit logging for login events"""
    import threading
    
    def async_log():
        try:
            log_audit_event(user_id, action, table_name, record_id, details)
        except Exception as e:
            logger.error(f"Async audit logging failed: {e}")
    
    thread = threading.Thread(target=async_log)
    thread.daemon = True
    thread.start()


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
            "SELECT PasswordHash, Username FROM User WHERE UserID = ?",
            (session['user_id'],
             ))
        row = cursor.fetchone()
        if not row or hash_password(old_password) != row[0]:
            return jsonify({'error': 'Incorrect old password'}), 401

        # Update new password
        hashed = hash_password(new_password)
        cursor.execute("""
            UPDATE User
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
        cursor.execute("SELECT Username, Email, FirstName, \"Last Name\", Role, IsApproved, CreatedAt, LastLogin FROM User WHERE UserID = ?", (session['user_id'],))
        
        user_info = cursor.fetchone()
        if not user_info:
            return jsonify({'error': 'User not found'}), 404

        # Get audit logs for this user if AuditLog table exists
        activity_history = []
        try:
            cursor.execute("SELECT Action, TargetType, Timestamp, Details FROM AuditLog WHERE UserID = ? ORDER BY Timestamp DESC LIMIT 10", (session['user_id'],))
            audit_logs = cursor.fetchall()
            if audit_logs:
                for log in audit_logs:
                    activity_history.append({
                        'action': log[0],
                        'targetType': log[1],
                        'timestamp': log[2].isoformat() if log[2] and hasattr(log[2], 'isoformat') else str(log[2]) if log[2] else None,
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
                ("Account Created", user_info[6].strftime('%Y-%m-%d %H:%M') if user_info[6] and hasattr(user_info[6], 'strftime') else str(user_info[6]) if user_info[6] else 'N/A'),
                ("Last Login", user_info[7].strftime('%Y-%m-%d %H:%M') if user_info[7] and hasattr(user_info[7], 'strftime') else str(user_info[7]) if user_info[7] else 'Never')
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


@app.route('/api/user-guide/download', methods=['GET'])
def download_user_guide():
    """Generate and download a comprehensive user guide PDF with dynamic content"""
    try:
        # Get system statistics for dynamic content
        active_members = active_users = total_societies = counties_represented = 0
        
        try:
            conn = get_db_connection()
            if conn:
                cursor = conn.cursor()
                
                # Get basic stats with error handling for each query
                try:
                    cursor.execute("SELECT COUNT(*) FROM Members WHERE IsActive = 1")
                    row = cursor.fetchone()
                    active_members = row[0] if row else 0
                except:
                    active_members = 0
                
                try:
                    cursor.execute("SELECT COUNT(*) FROM User WHERE IsApproved = 'True'")
                    row = cursor.fetchone()
                    active_users = row[0] if row else 0
                except:
                    active_users = 0
                
                try:
                    cursor.execute("SELECT COUNT(*) FROM Society")
                    row = cursor.fetchone()
                    total_societies = row[0] if row else 0
                except:
                    total_societies = 0
                
                try:
                    cursor.execute("SELECT COUNT(DISTINCT ic.CountyName) FROM IrishCounties ic INNER JOIN Members m ON ic.CountyID = m.CountyID WHERE ic.CountyName IS NOT NULL")
                    row = cursor.fetchone()
                    counties_represented = row[0] if row else 0
                except:
                    counties_represented = 0
                
                conn.close()
        except Exception as db_error:
            logger.error(f"Database error in user guide: {db_error}")
            # Continue with default values

        # Generate comprehensive user guide PDF - NO UNICODE CHARACTERS
        pdf = FPDF()
        pdf.add_page()
        
        # Cover Page
        pdf.set_font("Arial", 'B', 24)
        pdf.cell(200, 20, "USER GUIDE", ln=True, align='C')
        pdf.ln(5)
        
        pdf.set_font("Arial", 'B', 16)
        pdf.cell(200, 15, "BIS Membership Management System", ln=True, align='C')
        pdf.ln(10)
        
        pdf.set_font("Arial", size=12)
        pdf.cell(200, 8, f"Generated: {datetime.now().strftime('%B %d, %Y')}", ln=True, align='C')
        pdf.cell(200, 8, f"Version: {datetime.now().strftime('%Y.%m')}", ln=True, align='C')
        pdf.ln(15)
        
        # Current System Stats Box
        pdf.set_fill_color(240, 248, 255)  # Light blue background
        pdf.rect(30, 80, 150, 40, 'F')
        pdf.set_xy(35, 85)
        pdf.set_font("Arial", 'B', 12)
        pdf.cell(140, 8, "CURRENT SYSTEM STATISTICS", ln=True, align='C')
        pdf.set_xy(35, 95)
        pdf.set_font("Arial", size=10)
        pdf.cell(70, 6, f"Active Members: {active_members:,}", ln=False)
        pdf.cell(70, 6, f"Counties: {counties_represented}", ln=True)
        pdf.set_xy(35, 105)
        pdf.cell(70, 6, f"Active Users: {active_users:,}", ln=False)
        pdf.cell(70, 6, f"Societies: {total_societies}", ln=True)
        
        pdf.ln(30)
        
        # Table of Contents
        pdf.set_font("Arial", 'B', 16)
        pdf.cell(200, 12, "TABLE OF CONTENTS", ln=True, align='L')
        pdf.ln(5)
        
        toc_items = [
            "1. Getting Started",
            "2. User Roles & Access Levels", 
            "3. Navigation & Dashboard",
            "4. Member Directory Features",
            "5. Profile Management",
            "6. Support & Help"
        ]
        
        pdf.set_font("Arial", size=12)
        for item in toc_items:
            pdf.cell(200, 8, item, ln=True, align='L')
        
        # Start new page for content
        pdf.add_page()
        
        # Section 1: Getting Started
        pdf.set_font("Arial", 'B', 16)
        pdf.cell(200, 12, "1. GETTING STARTED", ln=True, align='L')
        pdf.ln(5)
        
        pdf.set_font("Arial", size=11)
        getting_started = [
            "Welcome to the BIS Membership Management System!",
            "",
            "LOGIN PROCESS:",
            "- Visit the login page and enter your credentials",
            "- Use 'Sign Up' to register for a new account",
            "- Use 'Forgot Password' for password recovery",
            "",
            "FIRST TIME SETUP:",
            "- Complete your profile information",
            "- Review your access level and features",
            "- Explore the navigation menu"
        ]
        
        for line in getting_started:
            if line == "":
                pdf.ln(3)
            else:
                pdf.cell(200, 6, line, ln=True, align='L')
        
        pdf.ln(10)
        
        # Section 2: User Roles
        pdf.set_font("Arial", 'B', 16)
        pdf.cell(200, 12, "2. USER ROLES & ACCESS LEVELS", ln=True, align='L')
        pdf.ln(5)
        
        pdf.set_font("Arial", size=11)
        roles_info = [
            "THREE MAIN USER ROLES:",
            "",
            "PUBLIC USERS:",
            "- View deceased member directories",
            "- Access public statistics",
            "- Submit support requests",
            "",
            "PRIVATE USERS:",
            "- All public features plus:",
            "- View complete member directories",
            "- Advanced search capabilities",
            "",
            "ADMINISTRATORS:",
            "- All system management features",
            "- User approval and management",
            "- Member record management"
        ]
        
        for line in roles_info:
            if line == "":
                pdf.ln(3)
            else:
                pdf.cell(200, 6, line, ln=True, align='L')
        
        # Section 3: Navigation
        pdf.add_page()
        pdf.set_font("Arial", 'B', 16)
        pdf.cell(200, 12, "3. NAVIGATION & FEATURES", ln=True, align='L')
        pdf.ln(5)
        
        pdf.set_font("Arial", size=11)
        nav_info = [
            "MAIN NAVIGATION AREAS:",
            "",
            "DASHBOARD:",
            "- System overview and statistics",
            "- Recent activity updates",
            "",
            "MEMBERS:",
            "- Search member directories",
            "- Filter by category, county, status",
            "- View member profiles",
            "",
            "MY PROFILE:",
            "- Update personal information",
            "- Change password",
            "- Request access changes",
            "",
            "SUPPORT:",
            "- Submit help requests",
            "- View FAQ and guides",
            "- Track support tickets"
        ]
        
        for line in nav_info:
            if line == "":
                pdf.ln(3)
            else:
                pdf.cell(200, 6, line, ln=True, align='L')
        
        # Current Statistics Section
        pdf.ln(15)
        pdf.set_font("Arial", 'B', 14)
        pdf.cell(200, 10, "CURRENT SYSTEM STATUS", ln=True, align='L')
        pdf.ln(5)
        
        pdf.set_font("Arial", size=11)
        current_stats = [
            f"As of {datetime.now().strftime('%B %Y')}:",
            f"Total Active Members: {active_members:,}",
            f"Geographic Coverage: {counties_represented} Irish counties",
            f"Registered System Users: {active_users:,}",
            f"Societies Represented: {total_societies}"
        ]
        
        for line in current_stats:
            pdf.cell(200, 6, line, ln=True, align='L')
        
        # Footer
        pdf.ln(20)
        pdf.set_font("Arial", 'I', 10)
        pdf.cell(200, 6, f"Auto-generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", ln=True, align='C')
        pdf.cell(200, 6, "For latest information, please refer to the live system.", ln=True, align='C')
        
        # Generate PDF output
        pdf_output = pdf.output(dest='S').encode('latin1')
        
        response = Response(
            pdf_output,
            mimetype='application/pdf',
            headers={
                'Content-Disposition': f'attachment; filename=user-guide-{datetime.now().strftime("%Y%m%d")}.pdf',
                'Content-Type': 'application/pdf'
            }
        )
        return response
        
    except Exception as e:
        logger.error(f"Error generating user guide: {e}")
        return jsonify({'error': f'Failed to generate user guide: {str(e)}'}), 500


# Authentication Routes
        pdf.cell(200, 12, "1. Getting Started", ln=True, align='L')
        pdf.ln(5)
        
        pdf.set_font("Arial", 'B', 12)
        pdf.cell(200, 8, "Creating Your Account", ln=True, align='L')
        pdf.set_font("Arial", size=10)
        getting_started_text = [
            "• Visit the membership portal homepage",
            "• Click 'Sign Up' to create a new account",
            "• Choose your access level (Public or Private)",
            "• Fill in your details and create a password",
            "• Wait for admin approval (for Private access)",
            "• Check your email for login credentials",
            "",
            "Login Process:",
            "• Enter your username or email address",
            "• Enter your password",
            "• Click 'Login' to access the system"
        ]
        
        for line in getting_started_text:
            pdf.cell(200, 6, line, ln=True, align='L')
        
        pdf.ln(5)
        
        # Section 2: User Roles
        pdf.set_font("Arial", 'B', 16)
        pdf.cell(200, 12, "2. User Roles & Access Levels", ln=True, align='L')
        pdf.ln(5)
        
        roles = [
            ("Public Users", [
                "• View deceased/inactive member records only",
                "• Access public dashboard and statistics", 
                "• Submit support tickets",
                "• No registration approval required"
            ]),
            ("Private Members", [
                "• View all member records (active & inactive)",
                "• Access enhanced member search and filtering",
                "• View detailed member profiles",
                "• Requires admin approval"
            ]),
            ("Administrators", [
                "• Full system access and management",
                "• User approval and role management",
                "• Data import/export capabilities",
                "• System configuration and settings"
            ])
        ]
        
        for role_title, role_features in roles:
            pdf.set_font("Arial", 'B', 12)
            pdf.cell(200, 8, role_title, ln=True, align='L')
            pdf.set_font("Arial", size=10)
            for feature in role_features:
                pdf.cell(200, 6, feature, ln=True, align='L')
            pdf.ln(3)
        
        # Section 3: Navigation
        pdf.add_page()
        pdf.set_font("Arial", 'B', 16)
        pdf.cell(200, 12, "3. 🧭 Navigation & Dashboard", ln=True, align='L')
        pdf.ln(5)
        
        pdf.set_font("Arial", 'B', 12)
        pdf.cell(200, 8, "Main Navigation Menu", ln=True, align='L')
        pdf.set_font("Arial", size=10)
        nav_items = [
            "🏠 Dashboard - Overview and statistics",
            "👥 Members - Browse and search member directory",
            "⚙️ Settings - Account and system preferences",
            "🎫 Support - Help desk and documentation",
            "👤 Profile - Your personal account information"
        ]
        
        for item in nav_items:
            pdf.cell(200, 6, f"• {item}", ln=True, align='L')
        
        pdf.ln(5)
        
        pdf.set_font("Arial", 'B', 12)
        pdf.cell(200, 8, "Dashboard Features", ln=True, align='L')
        pdf.set_font("Arial", size=10)
        dashboard_features = [
            "• Live membership statistics and charts",
            "• Regional distribution visualization",
            "• Recent activity and updates",
            "• Quick access to common tasks",
            "• Role-specific content and options"
        ]
        
        for feature in dashboard_features:
            pdf.cell(200, 6, feature, ln=True, align='L')
        
        # Section 4: Member Directory
        pdf.ln(10)
        pdf.set_font("Arial", 'B', 16)
        pdf.cell(200, 12, "4. 🔍 Member Directory Features", ln=True, align='L')
        pdf.ln(5)
        
        directory_features = [
            ("Search & Filtering", [
                "• Text search across names, counties, and notes",
                "• Filter by membership status (Active/Inactive)",
                "• Filter by membership category",
                "• Filter by Irish county",
                "• Advanced sorting options"
            ]),
            ("Member Information", [
                "• Full name and contact details",
                "• Birth and membership dates",
                "• Irish county connections",
                "• Membership category and status",
                "• Historical information and notes"
            ]),
            ("Export Options", [
                "• Download search results as CSV",
                "• Generate PDF reports",
                "• Filter by date ranges",
                "• Include/exclude specific fields"
            ])
        ]
        
        for section_title, section_items in directory_features:
            pdf.set_font("Arial", 'B', 12)
            pdf.cell(200, 8, section_title, ln=True, align='L')
            pdf.set_font("Arial", size=10)
            for item in section_items:
                pdf.cell(200, 6, item, ln=True, align='L')
            pdf.ln(3)
        
        # Section 5: Profile Management
        pdf.add_page()
        pdf.set_font("Arial", 'B', 16)
        pdf.cell(200, 12, "5. 👤 Profile Management", ln=True, align='L')
        pdf.ln(5)
        
        profile_sections = [
            ("Account Information", [
                "• Update your personal details",
                "• Change your password securely",
                "• Manage email preferences",
                "• View account creation date and activity"
            ]),
            ("Privacy Controls", [
                "• Request private member access",
                "• Download your personal data",
                "• View data usage and activity logs",
                "• Manage privacy preferences"
            ]),
            ("Access Requests", [
                "• Submit requests for elevated access",
                "• Track approval status",
                "• Understand access level differences",
                "• Contact admins for special requests"
            ])
        ]
        
        for section_title, section_items in profile_sections:
            pdf.set_font("Arial", 'B', 12)
            pdf.cell(200, 8, section_title, ln=True, align='L')
            pdf.set_font("Arial", size=10)
            for item in section_items:
                pdf.cell(200, 6, item, ln=True, align='L')
            pdf.ln(3)
        
        # Section 6: Support
        pdf.ln(5)
        pdf.set_font("Arial", 'B', 16)
        pdf.cell(200, 12, "6. 🎫 Support & Help", ln=True, align='L')
        pdf.ln(5)
        
        pdf.set_font("Arial", 'B', 12)
        pdf.cell(200, 8, "Getting Help", ln=True, align='L')
        pdf.set_font("Arial", size=10)
        support_info = [
            "• Use the Support tab to submit help tickets",
            "• Include detailed descriptions of issues",
            "• Set appropriate priority levels",
            "• Track ticket status and responses",
            "• FAQ section for common questions",
            "",
            "Contact Information:",
            "• Submit tickets through the support portal",
            "• Response time: 24-48 hours typically",
            "• Check your ticket history in 'My Tickets'"
        ]
        
        for line in support_info:
            pdf.cell(200, 6, line, ln=True, align='L')
        
        # Section 7: Privacy
        pdf.ln(10)
        pdf.set_font("Arial", 'B', 16)
        pdf.cell(200, 12, "7. 🔒 Privacy & Data Protection", ln=True, align='L')
        pdf.ln(5)
        
        privacy_info = [
            "Data Collection:",
            "• Only necessary information is collected",
            "• Account details for authentication",
            "• Activity logs for security and support",
            "",
            "Data Usage:",
            "• Information used only for membership management",
            "• No data sharing with third parties",
            "• Regular security updates and monitoring",
            "",
            "Your Rights:",
            "• Request access to your personal data",
            "• Download your data in PDF format",
            "• Request account deletion",
            "• Update incorrect information"
        ]
        
        pdf.set_font("Arial", size=10)
        for line in privacy_info:
            if line and not line.startswith("•"):
                pdf.set_font("Arial", 'B', 10)
            else:
                pdf.set_font("Arial", size=10)
            pdf.cell(200, 6, line, ln=True, align='L')
        
        # Section 8: Troubleshooting
        pdf.add_page()
        pdf.set_font("Arial", 'B', 16)
        pdf.cell(200, 12, "8. 🔧 Troubleshooting", ln=True, align='L')
        pdf.ln(5)
        
        troubleshooting = [
            ("Login Issues", [
                "• Check username/email spelling",
                "• Verify password (case-sensitive)",
                "• Clear browser cache and cookies",
                "• Try incognito/private browsing mode",
                "• Contact support if account is locked"
            ]),
            ("Search Problems", [
                "• Try simpler search terms",
                "• Check spelling and punctuation",
                "• Use filters to narrow results",
                "• Clear all filters and try again",
                "• Verify your access permissions"
            ]),
            ("Performance Issues", [
                "• Check internet connection",
                "• Close other browser tabs",
                "• Refresh the page",
                "• Try a different browser",
                "• Report persistent slow loading"
            ])
        ]
        
        for issue_title, solutions in troubleshooting:
            pdf.set_font("Arial", 'B', 12)
            pdf.cell(200, 8, issue_title, ln=True, align='L')
            pdf.set_font("Arial", size=10)
            for solution in solutions:
                pdf.cell(200, 6, solution, ln=True, align='L')
            pdf.ln(3)
        
        # Footer
        pdf.ln(15)
        pdf.set_font("Arial", 'I', 10)
        pdf.cell(200, 6, f"Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", ln=True, align='C')
        pdf.cell(200, 6, "This guide reflects the current system features and statistics.", ln=True, align='C')
        
        # Generate PDF output
        pdf_output = pdf.output(dest='S').encode('latin1')
        
        response = Response(
            pdf_output,
            mimetype='application/pdf',
            headers={
                'Content-Disposition': f'attachment; filename=user-guide-{datetime.now().strftime("%Y%m%d")}.pdf',
                'Content-Type': 'application/pdf'
            }
        )
        return response
        
    except Exception as e:
        logger.error(f"Error generating user guide: {e}")
        return jsonify({'error': 'Failed to generate user guide'}), 500


# Authentication Routes


def create_test_user(username, password, role, email=None):
    """Create a test user for development"""
    conn = get_db_connection()
    if not conn:
        return False

    try:
        cursor = conn.cursor()

        # Check if user already exists
        cursor.execute("SELECT UserID FROM User WHERE Username = ?", (username,))
        if cursor.fetchone():
            return True  # User already exists

        # Create the user
        user_id = generate_user_id()
        hashed_password = hash_password(password)

        cursor.execute("""
            INSERT INTO User (UserID, Username, Email, PasswordHash, Role, IsApproved, CreatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (user_id, username, email, hashed_password, role, 1, datetime.now()))

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
    """User login endpoint - optimized version"""
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
        
        # Single optimized query that gets user data and updates last login in one transaction
        cursor.execute("""
            SELECT UserID, Username, Email, Role, IsApproved, FirstName, "Last Name"
            FROM User
            WHERE (Username = ? OR Email = ?) AND PasswordHash = ? AND IsApproved = 1
        """, (username, username, hashed_password))

        user = cursor.fetchone()

        if user:
            logger.info(f"User {user[1]} logged in successfully")
            
            # Update last login in same transaction
            cursor.execute("""
                UPDATE User
                SET LastLogin = ?
                WHERE UserID = ?
            """, (datetime.now(), user[0]))
            conn.commit()

            # Set comprehensive session data to avoid database lookups
            session['user_id'] = user[0]
            session['username'] = user[1]
            session['email'] = user[2]
            session['user_role'] = user[3]
            session['first_name'] = user[5]
            session['last_name'] = user[6]
            session['last_activity'] = datetime.now().timestamp()
            session.permanent = True

            # Async audit logging to avoid blocking login response
            try:
                log_audit_event_async(user[0], 'LOGIN', 'User', user[0], f'User {username} logged in')
            except Exception:
                pass  # Don't fail login if audit logging fails

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

    return jsonify({'success': True, 'message': 'Session refreshed'})

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
        cursor.execute("SELECT COUNT(*) FROM Members WHERE IsActive = 1")
        row = cursor.fetchone()
        active_members = row[0] if row is not None else 0

        cursor.execute("SELECT COUNT(*) FROM Members WHERE IsActive = 0")
        row = cursor.fetchone()
        inactive_members = row[0] if row is not None else 0

        try:
            cursor.execute("SELECT COUNT(*) FROM Society")
            row = cursor.fetchone()
            total_societies = row[0] if row is not None else 0
        except sqlite3.OperationalError:
            # Society table doesn't exist, set to 0
            total_societies = 0

        cursor.execute("SELECT COUNT(*) FROM User WHERE IsApproved = 1")
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
        cursor.execute("SELECT COUNT(*) FROM User WHERE IsApproved = 0")
        row = cursor.fetchone()
        pending_approvals = row[0] if row is not None else 0

        # Members by category
        cursor.execute("""
            SELECT mc.CategoryName, COUNT(m.MemberID) as Count
            FROM MemberCategory mc
            LEFT JOIN Members m ON mc.CategoryID = m.MemberCategoryID
            WHERE m.IsActive = 1
            GROUP BY mc.CategoryName
            ORDER BY Count DESC
        """)
        categories = [{'name': row[0], 'count': row[1]}
                      for row in cursor.fetchall()]

        # Members by province (from addresses) - Province column doesn't exist, so count by city instead
        cursor.execute("""
            SELECT ma.City, COUNT(DISTINCT m.MemberID) as Count
            FROM MemberAddress ma, Members m
            WHERE ma.MemberID = m.MemberID 
            AND ma.IsCurrent = 1
            AND m.IsActive = 1
            AND ma.City IS NOT NULL
            GROUP BY ma.City
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
            SELECT
                (m.FirstName || ' ' || m.LastName) as Name,
                m.DateJoined,
                'New Member' as Activity,
                m.MemberID
            FROM Members m
            WHERE m.DateJoined IS NOT NULL
            ORDER BY m.DateJoined DESC
            LIMIT 10
        """)
        recent_activity = []
        for row in cursor.fetchall():
            recent_activity.append({
                'name': row[0],
                'date': row[1].strftime('%Y-%m-%d') if row[1] and hasattr(row[1], 'strftime') else str(row[1]) if row[1] else None,
                'activity': row[2],
                'id': row[3]
            })

        # Add recent recognitions to activity
        cursor.execute("""
            SELECT
                m.FirstName || ' ' || m.LastName as Name,
                mr.RecognitionID,
                ('Recognition: ' || rt.Name) as Activity,
                mr.RecognitionID
            FROM MemberRecognitions mr
            JOIN Members m ON mr.MemberID = m.MemberID
            JOIN RecognitionTypes rt ON mr.RecognitionTypeID = rt.RecognitionTypeID
            WHERE mr.IsActive = 1
            ORDER BY mr.RecognitionID DESC
            LIMIT 5
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
            SELECT UserID, Username, FirstName, "Last Name", Email, Role, CreatedAt
            FROM User
            WHERE IsApproved = 0
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
                "createdAt": row[6].strftime('%Y-%m-%d') if row[6] and hasattr(row[6], 'strftime') else str(row[6]) if row[6] else None
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
                UPDATE User SET IsApproved = 1 WHERE UserID = ?
            """, (user_id,))
        elif action == "reject":
            # Delete the unapproved user
            cursor.execute("""
                DELETE FROM User WHERE UserID = ?
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
            params.extend(search_pattern * 10)

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
                'dateOfBirth': row[6].strftime('%Y-%m-%d') if row[6] and hasattr(row[6], 'strftime') else str(row[6]) if row[6] else None,
                'dateJoined': row[7].strftime('%Y-%m-%d') if row[7] and hasattr(row[7], 'strftime') else str(row[7]) if row[7] else None,
                'dateEnded': row[8].strftime('%Y-%m-%d') if row[8] and hasattr(row[8], 'strftime') else str(row[8]) if row[8] else None,
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

        # Base query using MS Access JOIN syntax - back to original working version
        query = """
            SELECT 
                m.MemberID, m.FirstName, m.LastName, 
                m.[Place of Birth], m.[Date of Birth],
                m.IsActive, mc.CategoryName, ic.CountyName,
                m.DateJoined, m.DateEnded
            FROM 
                (Members AS m 
                LEFT JOIN MemberCategory AS mc ON m.MemberCategoryID = mc.CategoryID)
                LEFT JOIN IrishCounties AS ic ON m.CountyID = ic.CountyID
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
            member_id = row[0]
            
            # Get address info with simple query
            address_info = ""
            try:
                cursor.execute("""
                    SELECT Street, City 
                    FROM MemberAddress 
                    WHERE MemberID = ? AND IsCurrent = True
                """, (member_id,))
                addr_row = cursor.fetchone()
                if addr_row:
                    address_parts = [part for part in [addr_row[0], addr_row[1]] if part]
                    address_info = ", ".join(address_parts)
            except:
                address_info = ""
                
            # Get role info with simple query
            role_info = ""
            try:
                cursor.execute("""
                    SELECT Role 
                    FROM Users 
                    WHERE MemberID = ?
                """, (member_id,))
                role_row = cursor.fetchone()
                if role_row:
                    role_info = role_row[0]
            except:
                role_info = ""
            
            member_data = {
                'id': row[0],
                'firstName': row[1],
                'lastName': row[2],
                'placeOfBirth': row[3],
                'dateOfBirth': row[4].strftime('%Y-%m-%d') if row[4] and hasattr(row[4], 'strftime') else str(row[4]) if row[4] else None,
                'isActive': row[5] == 1 or row[5] == '1' or row[5] == 'True',
                'category': row[6],
                'county': row[7],
                'dateJoined': row[8].strftime('%Y-%m-%d') if row[8] and hasattr(row[8], 'strftime') else str(row[8]) if row[8] else None,
                'dateEnded': row[9].strftime('%Y-%m-%d') if row[9] and hasattr(row[9], 'strftime') else str(row[9]) if row[9] else None,
                'membershipYears': calculate_membership_years(row[8], row[9]) if row[8] else None,
                'address': address_info,
                'role': role_info
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
    
    # Convert string dates to datetime objects if needed
    if isinstance(date_joined, str):
        try:
            date_joined = datetime.fromisoformat(date_joined.replace('Z', ''))
        except (ValueError, AttributeError):
            try:
                date_joined = datetime.strptime(date_joined, '%Y-%m-%d')
            except (ValueError, AttributeError):
                return None
    
    if date_ended:
        if isinstance(date_ended, str):
            try:
                date_ended = datetime.fromisoformat(date_ended.replace('Z', ''))
            except (ValueError, AttributeError):
                try:
                    date_ended = datetime.strptime(date_ended, '%Y-%m-%d')
                except (ValueError, AttributeError):
                    date_ended = datetime.now()
        end_date = date_ended
    else:
        end_date = datetime.now()
    
    delta = end_date - date_joined
    return round(delta.days / 365.25)  # Account for leap years



@app.route('/api/members/<int:member_id>', methods=['GET'])
@auth_required
def get_member(member_id):
    """Get specific member details with properly resolved foreign keys"""
    print(f'DEBUG: Getting member {member_id}')
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()

        # Check if user has permission to view this member
        if session['user_role'] == 'Public':
            cursor.execute("SELECT IsActive FROM Members WHERE MemberID = ?", (member_id,))
            result = cursor.fetchone()
            if not result or result[0]:  # Active member - public can't view
                return jsonify({'error': 'Access denied'}), 403

        # 1. GET MEMBER BASIC INFO with all foreign key resolutions
        member_query = """
            SELECT 
                m.MemberID, m.FirstName, m.LastName, m.Email, m.PhoneNumber, 
                m.[Place of Birth], m.[Date of Birth],
                m.MemberCategoryID, mc.CategoryName,
                m.CountyID, ic.CountyName, 
                m.SurnameID, s.Surname,
                m.OccupationID, o.OccupationName,
                m.Notes, m.IsActive, m.OtherSocieties, 
                m.DateJoined, m.DateEnded, m.ApplicationDate, m.[Approval Date],
                m.ApprovedBy, m.SignedBy, m.Proposer, m.Seconder, m.ProposalDate
            FROM Members AS m
            LEFT JOIN MemberCategory AS mc ON m.MemberCategoryID = mc.CategoryID
            LEFT JOIN IrishCounties AS ic ON m.CountyID = ic.CountyID
            LEFT JOIN IrishSurnames AS s ON m.SurnameID = s.SurnameID
            LEFT JOIN Occupation AS o ON m.OccupationID = o.OccupationID
            WHERE m.MemberID = ?
        """
        
        cursor.execute(member_query, (member_id,))
        member_row = cursor.fetchone()
        
        if not member_row:
            return jsonify({'error': 'Member not found'}), 404

        # Build base member data
        member_data = {
            'id': member_row[0],
            'firstName': member_row[1] or '',
            'lastName': member_row[2] or '',
            'email': member_row[3] or '',
            'phoneNumber': member_row[4] or '',
            'placeOfBirth': member_row[5] or '',
            'dateOfBirth': format_date_for_frontend(member_row[6]),
            # Category info
            'memberCategoryID': member_row[7],
            'memberCategory': member_row[8] or '',
            # County info  
            'countyId': member_row[9],
            'county': member_row[10] or '',
            # Surname info
            'surnameId': member_row[11],
            'surname': member_row[12] or '',
            # Occupation info
            'occupationID': member_row[13],
            'occupation': member_row[14] or '',
            # Other fields
            'notes': member_row[15] or '',
            'isActive': member_row[16] == '1' or member_row[16] == 1 or member_row[16] is True,
            'otherSocieties': member_row[17] or '',
            'dateJoined': format_date_for_frontend(member_row[18]),
            'dateEnded': format_date_for_frontend(member_row[19]),
            'applicationDate': format_date_for_frontend(member_row[20]),
            'approvalDate': format_date_for_frontend(member_row[21]),
            'approvedBy': member_row[22] or '',
            'signedBy': member_row[23] or '',
            'proposer': member_row[24] or '',
            'seconder': member_row[25] or '',
            'proposalDate': format_date_for_frontend(member_row[26]),
        }

        # 2. GET ADDRESSES with proper field mapping
        address_query = """
            SELECT 
                ma.MemberAddressID, ma.Street, ma.City, 
                ma.ProvinceID, ma.CountryID, ma.PostalCode, 
                ma.FiscalYearID, fy.YearLabel, ma.IsCurrent
            FROM MemberAddress AS ma
            LEFT JOIN FiscalYear AS fy ON ma.FiscalYearID = fy.FiscalYearID
            WHERE ma.MemberID = ?
            ORDER BY ma.IsCurrent DESC, ma.MemberAddressID DESC
        """
        
        cursor.execute(address_query, (member_id,))
        address_rows = cursor.fetchall()
        
        addresses = []
        for addr in address_rows:
            # Handle province and country with fallbacks for common cases
            province_name = ''
            country_name = ''
            
            # Add fallbacks for common Canadian addresses
            if addr[2] == 'Charlottetown':  # PEI capital
                province_name = 'Prince Edward Island'
            
            if addr[4] == '0' or addr[4] == 0:  # Country ID 0 likely means Canada
                country_name = 'Canada'
            
            addresses.append({
                'id': addr[0],
                'street': addr[1] or '',  # Street field for frontend
                'addressLine1': addr[1] or '',  # Keep both for compatibility
                'addressLine2': '',  # Not in database
                'city': addr[2] or '',
                'provinceID': addr[3],
                'province': province_name,  # Province name from fallback logic
                'countryID': addr[4], 
                'country': country_name,  # Country name from fallback logic
                'postalCode': addr[5] or '',
                'fiscalYearID': addr[6],
                'yearLabel': addr[7] or '',  # Frontend expects yearLabel
                'fiscalYear': addr[7] or '',  # Keep both for compatibility
                'isCurrent': bool(addr[8])
            })
        
        member_data['addresses'] = addresses

        # 3. GET ROLES with proper name resolution
        role_query = """
            SELECT 
                mr.RoleID, r.RoleName, 
                mr.FiscalYearID, fy.YearLabel
            FROM MemberRole AS mr
            LEFT JOIN Role AS r ON mr.RoleID = r.RoleID
            LEFT JOIN FiscalYear AS fy ON mr.FiscalYearID = fy.FiscalYearID
            WHERE mr.MemberID = ?
            ORDER BY mr.FiscalYearID DESC
        """
        
        cursor.execute(role_query, (member_id,))
        role_rows = cursor.fetchall()
        
        role_fiscal_years = []
        for role in role_rows:
            role_fiscal_years.append({
                'roleID': role[0],
                'role': role[1] or f'Role ID {role[0]}',  # Use name or fallback to ID
                'fiscalYearID': role[2],
                'fiscalYear': role[3] or f'Fiscal Year ID {role[2]}',  # Use label or fallback to ID
                'roleName': role[1] or '',  # For compatibility
                'fiscalYearLabel': role[3] or ''  # For compatibility
            })
        
        member_data['roleFiscalYears'] = role_fiscal_years

        # 4. GET IRISH CONNECTIONS with proper name resolution
        irish_connections = []
        try:
            # Get both county and surname connections for this member
            cursor.execute("""
                SELECT 
                    icc.CountyID, ic.CountyName,
                    ics.SurnameID, isur.Surname
                FROM IrishConnectionByCounty AS icc
                LEFT JOIN IrishCounties AS ic ON icc.CountyID = ic.CountyID
                LEFT JOIN IrishConnectionBySurname AS ics ON icc.MemberID = ics.MemberID
                LEFT JOIN IrishSurnames AS isur ON ics.SurnameID = isur.SurnameID
                WHERE icc.MemberID = ?
                UNION
                SELECT 
                    icc2.CountyID, ic2.CountyName,
                    ics2.SurnameID, isur2.Surname
                FROM IrishConnectionBySurname AS ics2
                LEFT JOIN IrishSurnames AS isur2 ON ics2.SurnameID = isur2.SurnameID
                LEFT JOIN IrishConnectionByCounty AS icc2 ON ics2.MemberID = icc2.MemberID
                LEFT JOIN IrishCounties AS ic2 ON icc2.CountyID = ic2.CountyID
                WHERE ics2.MemberID = ?
            """, (member_id, member_id))
            connection_rows = cursor.fetchall()
            
            # Process connections - combine county and surname data
            seen_connections = set()
            for row in connection_rows:
                county_id, county_name, surname_id, surname_name = row
                
                # Create a unique key for this connection combination
                connection_key = (county_id or 0, surname_id or 0)
                if connection_key not in seen_connections:
                    seen_connections.add(connection_key)
                    
                    irish_connections.append({
                        'countyId': str(county_id) if county_id else '',
                        'county': county_name or '',
                        'surnameId': str(surname_id) if surname_id else '',
                        'surname': surname_name or '',
                        'type': 'Paternal'  # Default type, could be extended later
                    })
                    
        except Exception as e:
            print(f'DEBUG: Irish connections query failed: {e}')
        
        member_data['irishConnections'] = irish_connections

        print(f'DEBUG: Successfully built member data for {member_id}')
        print(f'DEBUG: Member county: {member_data.get("county")}')
        print(f'DEBUG: Member surname: {member_data.get("surname")}')
        print(f'DEBUG: Member addresses count: {len(member_data.get("addresses", []))}')
        print(f'DEBUG: Irish connections count: {len(irish_connections)}')
        print(f'DEBUG: Role fiscal years count: {len(member_data.get("roleFiscalYears", []))}')
        return jsonify(member_data)

    except Exception as e:
        print(f'DEBUG ERROR in get_member: {e}')
        return jsonify({'error': f'Failed to fetch member details: {str(e)}'}), 500
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

        # Helper function to convert empty strings to None
        def convert_to_int_or_none(value):
            if value is None or value == '' or value == 'null':
                return None
            try:
                return int(value)
            except (ValueError, TypeError):
                return None

        def convert_to_date_or_none(value):
            if value is None or value == '' or value == 'null':
                return None
            return value

        # Auto-set DateJoined to today if not provided
        date_joined = data.get('dateJoined')
        if not date_joined or date_joined == '' or date_joined == 'null':
            date_joined = datetime.now().strftime('%Y-%m-%d')

        # Create member record
        cursor.execute("""
            INSERT INTO Members (
                FirstName, LastName, Email, PhoneNumber,
                [Place of Birth], [Date of Birth], MemberCategoryID,
                CountyID, SurnameID, OccupationID, Notes,
                IsActive, OtherSocieties, DateJoined, DateEnded,
                ApplicationDate, [Approval Date], ApprovedBy, SignedBy,
                Proposer, Seconder, ProposalDate, CreatedAt
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data.get('firstName'),
            data.get('lastName'),
            data.get('email'),
            data.get('phoneNumber') or None,
            data.get('placeOfBirth') or None,
            convert_to_date_or_none(data.get('dateOfBirth')),
            convert_to_int_or_none(data.get('memberCategoryId')),
            convert_to_int_or_none(data.get('countyId')),
            convert_to_int_or_none(data.get('surnameId')),
            convert_to_int_or_none(data.get('occupationId')),
            data.get('notes') or '',
            bool(data.get('isActive', True)),
            data.get('otherSocieties') or None,
            date_joined,
            convert_to_date_or_none(data.get('dateEnded')),
            convert_to_date_or_none(data.get('applicationDate')),
            convert_to_date_or_none(data.get('approvalDate')),
            data.get('approvedBy') or None,
            data.get('signedBy') or None,
            data.get('proposer') or None,
            data.get('seconder') or None,
            convert_to_date_or_none(data.get('proposalDate')),
            datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        ))

        conn.commit()

        cursor.execute("SELECT @@IDENTITY")
        row = cursor.fetchone()
        member_id = row[0] if row is not None else None
        if member_id is None:
            return jsonify({'error': 'Failed to retrieve new member ID'}), 500

        # Handle multiple addresses
        if 'addresses' in data and data['addresses']:
            # Simple country mapping (since no Country lookup table exists)
            def map_country_to_id(country_name):
                if not country_name:
                    return None
                # For now, use simple mapping - can be expanded later
                country_mapping = {
                    'Canada': 1,
                    'United States': 2, 
                    'Ireland': 3,
                    'United Kingdom': 4,
                    'Other': 5
                }
                return country_mapping.get(country_name, 5)  # Default to 'Other'
                
            for address in data['addresses']:
                if address.get('street') or address.get('city'):  # Only if there's actual address data
                    # Handle both old countryID format and new country text format
                    country_id = address.get('countryID')
                    if country_id is None and address.get('country'):
                        country_id = map_country_to_id(address.get('country'))
                        
                    cursor.execute("""
                        INSERT INTO MemberAddress (MemberID, Street, City, CountryID, PostalCode, FiscalYearID, IsCurrent)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (
                        member_id,
                        address.get('street') or None,
                        address.get('city') or None,
                        country_id,
                        address.get('postalCode') or None,
                        convert_to_int_or_none(address.get('fiscalYearID')),
                        bool(address.get('isCurrent', True))
                    ))

        # Handle Irish connections by county
        if 'irishConnections' in data and data['irishConnections']:
            for connection in data['irishConnections']:
                county_id = convert_to_int_or_none(connection.get('countyId'))
                if county_id:
                    cursor.execute("""
                        INSERT INTO IrishConnectionByCounty (MemberID, CountyID)
                        VALUES (?, ?)
                    """, (member_id, county_id))

        # Handle Irish connections by surname
        if 'irishConnections' in data and data['irishConnections']:
            for connection in data['irishConnections']:
                surname_id = convert_to_int_or_none(connection.get('surnameId'))
                if surname_id:
                    cursor.execute("""
                        INSERT INTO IrishConnectionBySurname (MemberID, SurnameID)
                        VALUES (?, ?)
                    """, (member_id, surname_id))

        # Handle member roles for fiscal years
        if 'roleFiscalYears' in data and data['roleFiscalYears']:
            for role_assignment in data['roleFiscalYears']:
                role_id = convert_to_int_or_none(role_assignment.get('roleID'))
                fiscal_year_id = convert_to_int_or_none(role_assignment.get('fiscalYearID'))
                if role_id and fiscal_year_id:
                    cursor.execute("""
                        INSERT INTO MemberRole (MemberID, RoleID, FiscalYearID)
                        VALUES (?, ?, ?)
                    """, (member_id, role_id, fiscal_year_id))

        conn.commit()

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
    
    print("=== BACKEND UPDATE DEBUG ===")
    print(f"Received data keys: {list(data.keys()) if data else 'None'}")
    print(f"Phone number: {data.get('phoneNumber') if data else 'None'}")
    print(f"Irish connections: {data.get('irishConnections') if data else 'None'}")
    if data and 'irishConnections' in data:
        for i, conn in enumerate(data['irishConnections']):
            print(f"  Connection {i}: {conn}")
    print("=== END BACKEND DEBUG ===")

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()

        # Check if member exists
        cursor.execute("SELECT * FROM Members WHERE MemberID = ?", (member_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Member not found'}), 404

        # Convert data types properly
        def convert_to_int_or_none(value):
            if value is None or value == '' or value == 'null':
                return None
            try:
                return int(value)
            except (ValueError, TypeError):
                return None

        def convert_to_date_or_none(value):
            if value is None or value == '' or value == 'null':
                return None
            try:
                if isinstance(value, str):
                    # Handle various date formats
                    from datetime import datetime
                    return datetime.strptime(value, '%Y-%m-%d').date()
                return value
            except (ValueError, TypeError):
                return None

        # Update member record
        try:
            cursor.execute("""
                UPDATE Members SET
                    FirstName = ?,
                    LastName = ?,
                    Email = ?,
                    PhoneNumber = ?,
                    [Place of Birth] = ?,
                    [Date of Birth] = ?,
                    MemberCategoryID = ?,
                    CountyID = ?,
                    SurnameID = ?,
                    OccupationID = ?,
                    Notes = ?,
                    IsActive = ?,
                    OtherSocieties = ?,
                    DateJoined = ?,
                    DateEnded = ?,
                    ApplicationDate = ?,
                    [Approval Date] = ?,
                    ApprovedBy = ?,
                    SignedBy = ?,
                    Proposer = ?,
                    Seconder = ?,
                    ProposalDate = ?
                WHERE MemberID = ?
            """, (
                data.get('firstName'),
                data.get('lastName'),
                data.get('email'),
                data.get('phoneNumber', None),
                data.get('placeOfBirth', None),
                convert_to_date_or_none(data.get('dateOfBirth')),
                convert_to_int_or_none(data.get('memberCategoryId')),
                convert_to_int_or_none(data.get('countyId')),
                convert_to_int_or_none(data.get('surnameId')),
                convert_to_int_or_none(data.get('occupationId')),
                data.get('notes', ''),
                data.get('isActive', True),
                data.get('otherSocieties', None),
                convert_to_date_or_none(data.get('dateJoined')),
                convert_to_date_or_none(data.get('dateEnded')),
                convert_to_date_or_none(data.get('applicationDate')),
                convert_to_date_or_none(data.get('approvalDate')),
                data.get('approvedBy', None),
                data.get('signedBy', None),
                data.get('proposer', None),
                data.get('seconder', None),
                convert_to_date_or_none(data.get('proposalDate')),
                member_id
            ))
            print(f"Member update query executed. Rows affected: {cursor.rowcount}")
        except Exception as e:
            print(f"Error updating member: {e}")
            return jsonify({'error': f'Failed to update member: {str(e)}'}), 500

        # Handle addresses - clear existing and add new
        if 'addresses' in data:
            # Delete existing addresses
            cursor.execute("DELETE FROM MemberAddress WHERE MemberID = ?", (member_id,))
            
            # Simple country mapping (since no Country lookup table exists)
            def map_country_to_id(country_name):
                if not country_name:
                    return None
                # For now, use simple mapping - can be expanded later
                country_mapping = {
                    'Canada': 1,
                    'United States': 2, 
                    'Ireland': 3,
                    'United Kingdom': 4,
                    'Other': 5
                }
                return country_mapping.get(country_name, 5)  # Default to 'Other'
            
            # Add new addresses
            for address in data['addresses']:
                if address.get('street') or address.get('city'):  # Only if there's actual address data
                    # Handle both old countryID format and new country text format
                    country_id = address.get('countryID')
                    if country_id is None and address.get('country'):
                        country_id = map_country_to_id(address.get('country'))
                    
                    cursor.execute("""
                        INSERT INTO MemberAddress (MemberID, Street, City, CountryID, PostalCode, FiscalYearID, IsCurrent)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (
                        member_id,
                        address.get('street') or None,
                        address.get('city') or None,
                        country_id,
                        address.get('postalCode') or None,
                        convert_to_int_or_none(address.get('fiscalYearID')),
                        bool(address.get('isCurrent', True))
                    ))

        # Handle Irish connections - clear existing and add new
        if 'irishConnections' in data:
            try:
                # Delete existing Irish connections
                cursor.execute("DELETE FROM IrishConnectionByCounty WHERE MemberID = ?", (member_id,))
                print(f"Deleted existing county connections. Rows affected: {cursor.rowcount}")
                cursor.execute("DELETE FROM IrishConnectionBySurname WHERE MemberID = ?", (member_id,))
                print(f"Deleted existing surname connections. Rows affected: {cursor.rowcount}")
                
                # Add new Irish connections
                for connection in data['irishConnections']:
                    print(f"  Processing connection: {connection}")
                    county_id = convert_to_int_or_none(connection.get('countyId'))
                    surname_id = convert_to_int_or_none(connection.get('surnameId'))
                    
                    if county_id:
                        cursor.execute("""
                            INSERT INTO IrishConnectionByCounty (MemberID, CountyID)
                            VALUES (?, ?)
                        """, (member_id, county_id))
                        print(f"  Inserted county connection. Rows affected: {cursor.rowcount}")
                        
                    if surname_id:
                        cursor.execute("""
                            INSERT INTO IrishConnectionBySurname (MemberID, SurnameID)
                            VALUES (?, ?)
                        """, (member_id, surname_id))
                        print(f"  Inserted surname connection. Rows affected: {cursor.rowcount}")
            except Exception as e:
                print(f"Error updating Irish connections: {e}")
                return jsonify({'error': f'Failed to update Irish connections: {str(e)}'}), 500

        # Handle member roles - clear existing and add new
        if 'roleFiscalYears' in data:
            print(f"DEBUG: Processing role fiscal years: {data['roleFiscalYears']}")
            # Delete existing role assignments
            cursor.execute("DELETE FROM MemberRole WHERE MemberID = ?", (member_id,))
            print(f"DEBUG: Deleted existing roles. Rows affected: {cursor.rowcount}")
            
            # Add new role assignments
            for role_assignment in data['roleFiscalYears']:
                print(f"DEBUG: Processing role assignment: {role_assignment}")
                role_id = convert_to_int_or_none(role_assignment.get('roleID'))
                fiscal_year_id = convert_to_int_or_none(role_assignment.get('fiscalYearID'))
                print(f"DEBUG: Converted IDs - roleID: {role_id}, fiscalYearID: {fiscal_year_id}")
                if role_id and fiscal_year_id:
                    cursor.execute("""
                        INSERT INTO MemberRole (MemberID, RoleID, FiscalYearID)
                        VALUES (?, ?, ?)
                    """, (member_id, role_id, fiscal_year_id))
                    print(f"DEBUG: Inserted role assignment. Rows affected: {cursor.rowcount}")
                else:
                    print(f"DEBUG: Skipped role assignment - missing role_id or fiscal_year_id")
        else:
            print("DEBUG: No roleFiscalYears in data")

        # Log audit event (before commit, but don't let it fail the transaction)
        try:
            log_audit_event(
                session['user_id'],
                'UPDATE',
                'Members',
                member_id,
                f'Updated member: {data.get("firstName")} {data.get("lastName")}')
        except Exception as audit_error:
            print(f"Audit logging failed but continuing: {audit_error}")

        conn.commit()
        print("Transaction committed successfully!")

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
            SET IsActive = 0, DateEnded = ?
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
@private_or_admin_required
def get_recognitions():
    """Get all recognition types and member recognitions"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        
        # Get all member recognitions with details
        cursor.execute("""
            SELECT 
                mr.RecognitionID,
                rt.Name,
                rt.Description,
                rt.Icon,
                m.FirstName || ' ' || m.LastName as MemberName,
                mr.AwardedDate,
                mr.AwardedBy,
                mr.Notes
            FROM MemberRecognitions mr
            JOIN RecognitionTypes rt ON mr.RecognitionTypeID = rt.RecognitionTypeID
            LEFT JOIN Members m ON mr.MemberID = m.MemberID
            ORDER BY mr.AwardedDate DESC
        """)
        
        recognitions = []
        for row in cursor.fetchall():
            recognitions.append({
                'id': row[0],
                'typeName': row[1],
                'description': row[2], 
                'icon': row[3],
                'memberName': row[4],
                'awardedDate': row[5],
                'awardedBy': row[6],
                'notes': row[7]
            })
        
        return jsonify(recognitions)
    except Exception as e:
        return jsonify({'error': f'Failed to fetch recognitions: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/recognition-types', methods=['GET'])
@private_or_admin_required
def get_recognition_types():
    """Get all recognition types/categories"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT RecognitionTypeID, Name, Description, Icon FROM RecognitionTypes ORDER BY Name")
        
        types = []
        for row in cursor.fetchall():
            types.append({
                'id': row[0],
                'name': row[1],
                'description': row[2],
                'icon': row[3]
            })
        
        return jsonify(types)
    except Exception as e:
        return jsonify({'error': f'Failed to fetch recognition types: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/recognitions', methods=['POST'])
@admin_required
def add_member_recognition():
    """Add a recognition to a member (admin only)"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        data = request.json
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO MemberRecognitions (MemberID, RecognitionTypeID, AwardedDate, AwardedBy, Notes)
            VALUES (?, ?, ?, ?, ?)
        """, (
            data['memberId'],
            data['recognitionTypeId'], 
            data.get('awardedDate', datetime.now().strftime('%Y-%m-%d')),
            data.get('awardedBy', 'System'),
            data.get('notes', '')
        ))
        
        conn.commit()
        return jsonify({'message': 'Recognition added successfully', 'id': cursor.lastrowid})
    except Exception as e:
        return jsonify({'error': f'Failed to add recognition: {str(e)}'}), 500
    finally:
        conn.close()


# Keep the old endpoint for backward compatibility
@app.route('/api/recognitions/old', methods=['GET'])
@private_or_admin_required
def get_old_recognitions():
    """Legacy recognitions endpoint - redirects to new format"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        # Try the old structure first, fall back to new structure
        try:
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
                    'id': row[0],
                    'RecognitionID': row[0],
                    'description': row[1],
                    'isActive': row[2],
                    'type': row[3],
                    'society': row[4],
                    'fiscalYear': row[5]
                })
            return jsonify(recognitions)
        except:
            # Fall back to new structure
            return jsonify([])
    except Exception as e:
        return jsonify({'error': f'Failed to fetch recognitions: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/recognitions/old', methods=['POST'])
@admin_required
def create_old_recognition():
    """Create recognition using legacy table structure"""
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
        new_id = cursor.lastrowid
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
        cursor.execute("SELECT Username FROM User WHERE UserID = ?", (user_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        # Update role
        cursor.execute("UPDATE User SET Role = ? WHERE UserID = ?", (new_role, user_id))
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
        cursor.execute("SELECT Username FROM User WHERE UserID = ?", (user_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        # Approve user
        cursor.execute("UPDATE User SET IsApproved = 1 WHERE UserID = ?", (user_id,))
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
            SELECT UserID, Username, FirstName, "Last Name", Email, Role, IsApproved, CreatedAt, LastLogin
            FROM User
            ORDER BY UserID DESC
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
                'createdDate': row[7].strftime('%Y-%m-%d') if row[7] and hasattr(row[7], 'strftime') else str(row[7]) if row[7] else None,
                'lastLogin': row[8].strftime('%Y-%m-%d %H:%M:%S') if row[8] and hasattr(row[8], 'strftime') else str(row[8]) if row[8] else None
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
            "SELECT UserID FROM User WHERE Username = ? OR Email = ?",
            (data.get('username'),
             data.get('email')))
        if cursor.fetchone():
            return jsonify({'error': 'Username or email already exists'}), 400

        hashed_password = hash_password(data.get('password'))

        cursor.execute("""
            INSERT INTO User (Username, Email, PasswordHash, Role, IsApproved, CreatedAt)
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
            "SELECT UserID, Username FROM User WHERE Email = ?", (email,))
        user = cursor.fetchone()

        if user:
            # Generate reset token
            reset_token = generate_reset_token()
            reset_expires = datetime.now() + timedelta(hours=1)

            # Store reset token
            cursor.execute("""
                UPDATE User
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
            FROM User
            WHERE ResetToken = ? AND ResetRequestedAt > ?
        """, (token, datetime.now() - timedelta(hours=1)))

        user = cursor.fetchone()
        if not user:
            return jsonify({'error': 'Invalid or expired token'}), 400

        # Update password and clear token
        hashed_password = hash_password(new_password)
        cursor.execute("""
            UPDATE User
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
            "SELECT Username FROM User WHERE UserID = ? AND (Email IS NULL OR Email = '')",
            (user_id,
             ))
        user = cursor.fetchone()
        if not user:
            return jsonify(
                {'error': 'User not found or user has an email'}), 404

        hashed_password = hash_password(new_password)

        # Update password
        cursor.execute("""
            UPDATE User
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
            SET IsRead = 1
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
            # Helper function to format dates safely
            def format_date_safe(date_value):
                if not date_value:
                    return ''
                if hasattr(date_value, 'strftime'):
                    return date_value.strftime('%Y-%m-%d')
                else:
                    return str(date_value)
            
            writer.writerow([
                row[0] or '',  # FirstName
                row[1] or '',  # LastName
                row[2] or '',  # Email
                row[3] or '',  # PhoneNumber
                row[4] or '',  # Place of Birth
                format_date_safe(row[5]),  # Date of Birth
                format_date_safe(row[6]),  # DateJoined
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
                   m.Place of Birth, m.Date of Birth, m.DateJoined, m.IsActive, 
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
            pdf.cell(0, 10, f"{row[0]} {row[1]}, {row[2]}, {row[3]}, {row[4]}, FY: {row[5]}", ln=True)

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
            pdf.cell(0, 10, f"{row[0]} - {row[1]} | {row[2]} | FY: {row[3]} | Active: {'Yes' if row[4] else 'No'}", ln=True)

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

# --- Individual Member Export ---

@app.route('/api/export/member/<int:member_id>/csv', methods=['GET'])
@private_or_admin_required
def export_member_csv(member_id):
    """Export individual member information as CSV"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()
        
        # Get member details with simple query
        cursor.execute("""
            SELECT 
                m.FirstName, m.LastName, m.Place of Birth, m.Date of Birth,
                m.DateJoined, m.DateEnded, m.IsActive, mc.CategoryName, ic.CountyName
            FROM 
                (Members AS m 
                LEFT JOIN MemberCategory AS mc ON m.MemberCategoryID = mc.CategoryID)
                LEFT JOIN IrishCounties AS ic ON m.CountyID = ic.CountyID
            WHERE m.MemberID = ?
        """, (member_id,))
        
        row = cursor.fetchone()
        if not row:
            return jsonify({'error': 'Member not found'}), 404

        # Get address info with simple query
        address_row = None
        try:
            cursor.execute("""
                SELECT Street, City, PostalCode 
                FROM MemberAddress 
                WHERE MemberID = ? AND IsCurrent = True
            """, (member_id,))
            address_row = cursor.fetchone()
        except:
            pass

        # Get user account info with simple query
        user_row = None
        try:
            cursor.execute("""
                SELECT Username, Role, Email 
                FROM Users 
                WHERE MemberID = ?
            """, (member_id,))
            user_row = cursor.fetchone()
        except:
            pass

        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow(['Field', 'Value'])
        
        # Write member data
        writer.writerow(['First Name', row[0] or ''])
        writer.writerow(['Last Name', row[1] or ''])
        writer.writerow(['Place of Birth', row[2] or ''])
        writer.writerow(['Date of Birth', row[3].strftime('%Y-%m-%d') if row[3] else ''])
        writer.writerow(['Date Joined', row[4].strftime('%Y-%m-%d') if row[4] else ''])
        writer.writerow(['Date Ended', row[5].strftime('%Y-%m-%d') if row[5] else ''])
        writer.writerow(['Active', 'Yes' if row[6] else 'No'])
        writer.writerow(['Category', row[7] or ''])
        writer.writerow(['County', row[8] or ''])
        writer.writerow(['Street', address_row[0] if address_row else ''])
        writer.writerow(['City', address_row[1] if address_row else ''])
        writer.writerow(['Postal Code', address_row[2] if address_row else ''])
        writer.writerow(['Username', user_row[0] if user_row else ''])
        writer.writerow(['Role', user_row[1] if user_row else ''])
        writer.writerow(['Email', user_row[2] if user_row else ''])
        
        output.seek(0)
        filename = f"member_{row[0]}_{row[1]}.csv".replace(' ', '_')
        return Response(output, mimetype='text/csv', headers={
            "Content-Disposition": f"attachment;filename={filename}"
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to export member CSV: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/export/member/<int:member_id>/pdf', methods=['GET'])
@private_or_admin_required  
def export_member_pdf(member_id):
    """Export individual member information as PDF"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()
        
        # Get member details with simple query
        cursor.execute("""
            SELECT 
                m.FirstName, m.LastName, m.Place of Birth, m.Date of Birth,
                m.DateJoined, m.DateEnded, m.IsActive, mc.CategoryName, ic.CountyName
            FROM 
                (Members AS m 
                LEFT JOIN MemberCategory AS mc ON m.MemberCategoryID = mc.CategoryID)
                LEFT JOIN IrishCounties AS ic ON m.CountyID = ic.CountyID
            WHERE m.MemberID = ?
        """, (member_id,))
        
        row = cursor.fetchone()
        if not row:
            return jsonify({'error': 'Member not found'}), 404

        # Get address info with simple query
        address_row = None
        try:
            cursor.execute("""
                SELECT Street, City, PostalCode 
                FROM MemberAddress 
                WHERE MemberID = ? AND IsCurrent = True
            """, (member_id,))
            address_row = cursor.fetchone()
        except:
            pass

        # Get user account info with simple query
        user_row = None
        try:
            cursor.execute("""
                SELECT Username, Role, Email 
                FROM Users 
                WHERE MemberID = ?
            """, (member_id,))
            user_row = cursor.fetchone()
        except:
            pass

        pdf = FPDF()
        pdf.add_page()
        pdf.set_font('Arial', 'B', 16)
        pdf.cell(0, 10, f'Member Information: {row[0]} {row[1]}', ln=True, align='C')
        pdf.ln(10)
        
        pdf.set_font('Arial', '', 12)
        
        # Member details
        fields = [
            ('First Name', row[0]),
            ('Last Name', row[1]), 
            ('Place of Birth', row[2]),
            ('Date of Birth', row[3].strftime('%Y-%m-%d') if row[3] else 'N/A'),
            ('Date Joined', row[4].strftime('%Y-%m-%d') if row[4] else 'N/A'),
            ('Date Ended', row[5].strftime('%Y-%m-%d') if row[5] else 'N/A'),
            ('Status', 'Active' if row[6] else 'Inactive'),
            ('Category', row[7] or 'N/A'),
            ('County', row[8] or 'N/A'),
            ('Street Address', address_row[0] if address_row else 'N/A'),
            ('City', address_row[1] if address_row else 'N/A'),
            ('Postal Code', address_row[2] if address_row else 'N/A'),
            ('Username', user_row[0] if user_row else 'N/A'),
            ('Role', user_row[1] if user_row else 'N/A'),
            ('Email', user_row[2] if user_row else 'N/A')
        ]
        
        for field, value in fields:
            pdf.cell(50, 8, f'{field}:', 0, 0)
            pdf.cell(0, 8, str(value or 'N/A'), 0, 1)
            
        pdf_bytes = pdf.output(dest='S')
        if isinstance(pdf_bytes, bytearray):
            pdf_bytes = bytes(pdf_bytes)
        
        filename = f"member_{row[0]}_{row[1]}.pdf".replace(' ', '_')
        response = Response(pdf_bytes)
        response.headers.set('Content-Disposition', 'attachment', filename=filename)
        response.headers.set('Content-Type', 'application/pdf')
        return response
        
    except Exception as e:
        return jsonify({'error': f'Failed to export member PDF: {str(e)}'}), 500
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
            "SELECT PasswordHash FROM User WHERE UserID = ?", (session['user_id'],))
        result = cursor.fetchone()
        if not result or not verify_password(current_password, result[0]):
            return jsonify({'error': 'Current password is incorrect'}), 403

        # Set new password
        hashed_password = hash_password(new_password)
        cursor.execute("""
            UPDATE User
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
        unique_filename = f"profile_{session['user_id']}_{uuid.uuid4()}_{filename}"
        file_path = os.path.join(PHOTO_FOLDER, unique_filename)
        file.save(file_path)

        # Optional resize with PIL here...

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE User
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
            "SELECT Username FROM User WHERE UserID = ?", (user_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        cursor.execute(
            "UPDATE User SET IsApproved = ? WHERE UserID = ?", (is_approved, user_id))
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


@app.route('/api/users/<int:user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    """Update user information (username, email, etc.)"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get current user info
        cursor.execute("SELECT Username, Email, FirstName, \"Last Name\" FROM User WHERE UserID = ?", (user_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Build update query dynamically
        update_fields = []
        params = []
        
        if 'username' in data:
            update_fields.append("Username = ?")
            params.append(data['username'])
        
        if 'email' in data:
            update_fields.append("Email = ?")
            params.append(data['email'])
        
        if 'firstName' in data:
            update_fields.append("FirstName = ?")
            params.append(data['firstName'])
        
        if 'lastName' in data:
            update_fields.append("Last Name = ?")
            params.append(data['lastName'])
        
        if not update_fields:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        # Add user_id for WHERE clause
        params.append(user_id)
        
        query = f"UPDATE User SET {', '.join(update_fields)} WHERE UserID = ?"
        cursor.execute(query, params)
        conn.commit()
        
        # Log the change
        log_audit_event(
            session['user_id'], 
            'USER_UPDATE', 
            'User', 
            user_id,
            f'Updated user fields: {", ".join(data.keys())}'
        )
        
        return jsonify({
            'success': True, 
            'message': f'User {user_id} updated successfully'
        })
        
    except Exception as e:
        logger.error(f"Error updating user {user_id}: {e}")
        return jsonify({'error': f'Failed to update user: {str(e)}'}), 500
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
        cursor.execute("SELECT CountyID, CountyName FROM IrishCounties ORDER BY CountyName")
        counties = [{'value': row[0], 'label': row[1]} for row in cursor.fetchall()]
        print(f'DEBUG: Found {len(counties)} counties')
        
        # Categories
        cursor.execute("SELECT CategoryID, CategoryName FROM MemberCategory ORDER BY CategoryName")
        categories = [{'value': row[0], 'label': row[1]} for row in cursor.fetchall()]
        print(f'DEBUG: Found {len(categories)} categories')
        
        # Fiscal Years
        cursor.execute("SELECT FiscalYearID, YearLabel FROM FiscalYear ORDER BY FiscalYearID DESC")
        fiscalYears = [{'value': row[0], 'label': row[1]} for row in cursor.fetchall() if row[0] is not None]
        print(f'DEBUG: Found {len(fiscalYears)} fiscal years')
        
        # Societies
        cursor.execute("SELECT SocietyID, SocietyName FROM Society ORDER BY SocietyName")
        societies = [{'value': row[0], 'label': row[1]} for row in cursor.fetchall()]
        print(f'DEBUG: Found {len(societies)} societies')
        
        # Roles
        cursor.execute("SELECT RoleID, RoleName FROM Role ORDER BY RoleName")
        roles = [{'value': row[0], 'label': row[1]} for row in cursor.fetchall()]
        print(f'DEBUG: Found {len(roles)} roles: {[r["label"] for r in roles]}')
        
        # Surnames for Irish connections
        cursor.execute("SELECT SurnameID, Surname FROM IrishSurnames ORDER BY Surname")
        surnames = [{'value': row[0], 'label': row[1]} for row in cursor.fetchall()]
        print(f'DEBUG: Found {len(surnames)} surnames: {[s["label"] for s in surnames]}')
        
        # Occupations
        cursor.execute("SELECT OccupationID, OccupationName FROM Occupation ORDER BY OccupationName")
        occupations = [{'value': row[0], 'label': row[1]} for row in cursor.fetchall()]
        print(f'DEBUG: Found {len(occupations)} occupations')
        
        response_data = {
            'counties': counties,
            'categories': categories,
            'fiscalYears': fiscalYears,
            'societies': societies,
            'roles': roles,
            'surnames': surnames,
            'occupations': occupations
        }
        
        print(f'DEBUG: Returning lookups response with {len(response_data)} sections')
        return jsonify(response_data)
    except Exception as e:
        return jsonify({'error': f'Failed to fetch lookups: {str(e)}'}), 500
    finally:
        conn.close()

# Debug endpoint to show all surnames
@app.route('/api/debug/surnames', methods=['GET'])
def debug_surnames():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT SurnameID, Surname FROM IrishSurnames ORDER BY Surname")
        surnames = cursor.fetchall()
        return jsonify({
            'count': len(surnames),
            'surnames': [{'id': row[0], 'name': row[1]} for row in surnames]
        })
    except Exception as e:
        return jsonify({'error': f'Failed to fetch surnames: {str(e)}'}), 500
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

# --- Create Lookup Items ---
@app.route('/api/lookups/fiscal-years', methods=['POST'])
@admin_required
def create_fiscal_year():
    """Create new fiscal year (Admin only)"""
    data = request.get_json()
    import re
    if not data or not data.get('yearLabel'):
        return jsonify({'error': 'Year label is required'}), 400
    year_label = data['yearLabel']
    # Allow any year label (e.g., '2025', '1825', '2025-2026')
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        
        # Check if fiscal year already exists
        cursor.execute("SELECT FiscalYearID FROM FiscalYear WHERE YearLabel = ?", (data['yearLabel'],))
        if cursor.fetchone():
            return jsonify({'error': 'Fiscal year already exists'}), 409
        
        # Insert new fiscal year (simplified - only YearLabel)
        cursor.execute("""
            INSERT INTO FiscalYear (YearLabel)
            VALUES (?)
        """, (
            data['yearLabel'],
        ))
        
        conn.commit()
        
        # Get the new ID (SQLite)
        new_id = cursor.lastrowid

        return jsonify({
            'success': True,
            'id': new_id,
            'yearLabel': data['yearLabel']
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Failed to create fiscal year: {str(e)}'}), 500
    finally:
        conn.close()

@app.route('/api/lookups/categories', methods=['POST'])
@admin_required
def create_category():
    """Create new member category (Admin only)"""
    data = request.get_json()
    if not data or not data.get('categoryName'):
        return jsonify({'error': 'Category name is required'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        
        # Check if category already exists
        cursor.execute("SELECT CategoryID FROM MemberCategory WHERE CategoryName = ?", (data['categoryName'],))
        if cursor.fetchone():
            return jsonify({'error': 'Category already exists'}), 409
        
        # Insert new category
        cursor.execute("""
            INSERT INTO MemberCategory (CategoryName)
            VALUES (?)
        """, (data['categoryName'],))
        
        conn.commit()
        
        # Get the new ID
        cursor.execute("SELECT @@IDENTITY")
        row = cursor.fetchone()
        new_id = row[0] if row else None
        
        return jsonify({
            'success': True,
            'id': new_id,
            'categoryName': data['categoryName']
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Failed to create category: {str(e)}'}), 500
    finally:
        conn.close()

@app.route('/api/lookups/roles', methods=['POST'])
@admin_required
def create_role():
    """Create new role (Admin only)"""
    data = request.get_json()
    if not data or not data.get('roleName'):
        return jsonify({'error': 'Role name is required'}), 400
    
    # Clean the role name
    role_name = data['roleName'].strip()
    if not role_name:
        return jsonify({'error': 'Role name cannot be empty'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        
        # Check if role already exists (case insensitive comparison in Python)
        cursor.execute("SELECT RoleID, RoleName FROM Role")
        existing_roles = cursor.fetchall()
        print(f'DEBUG: Checking role "{role_name}" against existing roles:')
        for existing_role in existing_roles:
            print(f'  Existing: "{existing_role[1]}" | Lower: "{existing_role[1].lower()}" | Input: "{role_name.lower()}"')
            if existing_role[1].lower() == role_name.lower():
                print(f'DEBUG: Found duplicate role match!')
                return jsonify({'error': 'Role already exists'}), 409
        
        print(f'DEBUG: No duplicate found, inserting role "{role_name}"')
        # Insert new role
        cursor.execute("""
            INSERT INTO Role (RoleName)
            VALUES (?)
        """, (role_name,))
        
        conn.commit()
        
        # Get the new ID
        cursor.execute("SELECT @@IDENTITY")
        row = cursor.fetchone()
        new_id = row[0] if row else None
        
        return jsonify({
            'success': True,
            'id': new_id,
            'roleName': role_name
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Failed to create role: {str(e)}'}), 500
    finally:
        conn.close()

@app.route('/api/lookups/societies', methods=['POST'])
@admin_required
def create_society_lookup():
    """Create new society lookup (Admin only)"""
    data = request.get_json()
    if not data or not data.get('societyName'):
        return jsonify({'error': 'Society name is required'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        
        # Check if society already exists
        cursor.execute("SELECT SocietyID FROM Society WHERE SocietyName = ?", (data['societyName'],))
        if cursor.fetchone():
            return jsonify({'error': 'Society already exists'}), 409
        
        # Insert new society
        cursor.execute("""
            INSERT INTO Society (SocietyName)
            VALUES (?)
        """, (data['societyName'],))
        
        conn.commit()
        
        # Get the new ID
        cursor.execute("SELECT @@IDENTITY")
        row = cursor.fetchone()
        new_id = row[0] if row else None
        
        return jsonify({
            'success': True,
            'id': new_id,
            'societyName': data['societyName']
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Failed to create society: {str(e)}'}), 500
    finally:
        conn.close()

@app.route('/api/lookups/occupations', methods=['POST'])
@admin_required
def create_occupation():
    """Create new occupation (Admin only)"""
    data = request.get_json()
    if not data or not data.get('occupationName'):
        return jsonify({'error': 'Occupation name is required'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        
        # Check if occupation already exists
        cursor.execute("SELECT OccupationID FROM Occupation WHERE OccupationName = ?", (data['occupationName'],))
        if cursor.fetchone():
            return jsonify({'error': 'Occupation already exists'}), 409
        
        # Insert new occupation
        cursor.execute("""
            INSERT INTO Occupation (OccupationName)
            VALUES (?)
        """, (data['occupationName'],))
        
        conn.commit()
        
        # Get the new ID
        cursor.execute("SELECT @@IDENTITY")
        row = cursor.fetchone()
        new_id = row[0] if row else None
        
        return jsonify({
            'success': True,
            'id': new_id,
            'occupationName': data['occupationName']
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Failed to create occupation: {str(e)}'}), 500
    finally:
        conn.close()

@app.route('/api/lookups/surnames', methods=['POST'])
@admin_required
def create_surname():
    """Create new Irish surname (Admin only)"""
    data = request.get_json()
    if not data or not data.get('surname'):
        return jsonify({'error': 'Surname is required'}), 400
    
    # Clean the surname
    surname = data['surname'].strip()
    if not surname:
        return jsonify({'error': 'Surname cannot be empty'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        
        # Check if surname already exists (case insensitive comparison in Python)
        cursor.execute("SELECT SurnameID, Surname FROM IrishSurnames")
        existing_surnames = cursor.fetchall()
        print(f'DEBUG: Checking surname "{surname}" against existing surnames:')
        for existing_surname in existing_surnames:
            print(f'  Existing: "{existing_surname[1]}" | Lower: "{existing_surname[1].lower()}" | Input: "{surname.lower()}"')
            if existing_surname[1].lower() == surname.lower():
                print(f'DEBUG: Found duplicate surname match!')
                return jsonify({'error': 'Surname already exists'}), 409
        
        print(f'DEBUG: No duplicate found, inserting surname "{surname}"')
        # Insert new surname
        cursor.execute("""
            INSERT INTO IrishSurnames (Surname)
            VALUES (?)
        """, (surname,))
        
        conn.commit()
        
        # Get the new ID
        cursor.execute("SELECT @@IDENTITY")
        row = cursor.fetchone()
        new_id = row[0] if row else None
        
        return jsonify({
            'success': True,
            'id': new_id,
            'surname': surname
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Failed to create surname: {str(e)}'}), 500
    finally:
        conn.close()


# --- Delete Lookup Items ---
@app.route('/api/lookups/fiscal-years/<int:fiscal_year_id>', methods=['DELETE'])
@admin_required
def delete_fiscal_year(fiscal_year_id):
    """Delete fiscal year (Admin only)"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM FiscalYear WHERE FiscalYearID = ?", (fiscal_year_id,))
        
        if cursor.rowcount == 0:
            return jsonify({'error': 'Fiscal year not found'}), 404
            
        conn.commit()
        return jsonify({'success': True}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to delete fiscal year: {str(e)}'}), 500
    finally:
        conn.close()

@app.route('/api/lookups/categories/<int:category_id>', methods=['DELETE'])
@admin_required
def delete_category(category_id):
    """Delete member category (Admin only)"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM MemberCategory WHERE CategoryID = ?", (category_id,))
        
        if cursor.rowcount == 0:
            return jsonify({'error': 'Category not found'}), 404
            
        conn.commit()
        return jsonify({'success': True}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to delete category: {str(e)}'}), 500
    finally:
        conn.close()

@app.route('/api/lookups/roles/<int:role_id>', methods=['DELETE'])
@admin_required
def delete_role(role_id):
    """Delete member role (Admin only)"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM MemberRole WHERE RoleID = ?", (role_id,))
        
        if cursor.rowcount == 0:
            return jsonify({'error': 'Role not found'}), 404
            
        conn.commit()
        return jsonify({'success': True}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to delete role: {str(e)}'}), 500
    finally:
        conn.close()

@app.route('/api/lookups/occupations/<int:occupation_id>', methods=['DELETE'])
@admin_required
def delete_occupation(occupation_id):
    """Delete occupation (Admin only)"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM Occupation WHERE OccupationID = ?", (occupation_id,))
        
        if cursor.rowcount == 0:
            return jsonify({'error': 'Occupation not found'}), 404
            
        conn.commit()
        return jsonify({'success': True}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to delete occupation: {str(e)}'}), 500
    finally:
        conn.close()

@app.route('/api/lookups/surnames/<int:surname_id>', methods=['DELETE'])
@admin_required
def delete_surname(surname_id):
    """Delete surname (Admin only)"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM IrishSurnames WHERE SurnameID = ?", (surname_id,))
        
        if cursor.rowcount == 0:
            return jsonify({'error': 'Surname not found'}), 404
            
        conn.commit()
        return jsonify({'success': True}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to delete surname: {str(e)}'}), 500
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
                   FirstName, "Last Name"
            FROM User
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
            'createdDate': user[5].strftime('%Y-%m-%d') if user[5] and hasattr(user[5], 'strftime') else str(user[5]) if user[5] else None,
            'lastLogin': user[6].strftime('%Y-%m-%d %H:%M') if user[6] and hasattr(user[6], 'strftime') else str(user[6]) if user[6] else None,
            'firstName': user[7],
            'lastName': user[8]
        })
    except Exception as e:
        return jsonify({'error': f'Failed to fetch profile: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/my-profile', methods=['PUT'])
@auth_required  # All logged-in users can update their own profile
def update_my_profile():
    """Update profile information for the logged-in user"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get current user info to verify they exist
        cursor.execute("SELECT Username, Email, FirstName, \"Last Name\" FROM User WHERE UserID = ?", (session['user_id'],))
        user = cursor.fetchone()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Build update query dynamically based on provided fields
        update_fields = []
        params = []
        
        if 'username' in data:
            # Check if username is already taken by another user - use separate queries to avoid parameter issues
            cursor.execute("SELECT UserID FROM User WHERE Username = ?", (data['username'],))
            existing_user = cursor.fetchone()
            if existing_user and existing_user[0] != session['user_id']:
                return jsonify({'error': 'Username is already taken'}), 400
            update_fields.append("Username = ?")
            params.append(data['username'])
        
        if 'email' in data:
            # Check if email is already taken by another user - use separate queries to avoid parameter issues
            cursor.execute("SELECT UserID FROM User WHERE Email = ?", (data['email'],))
            existing_user = cursor.fetchone()
            if existing_user and existing_user[0] != session['user_id']:
                return jsonify({'error': 'Email is already taken'}), 400
            if cursor.fetchone():
                return jsonify({'error': 'Email is already taken'}), 400
            update_fields.append("Email = ?")
            params.append(data['email'])
        
        if 'firstName' in data:
            update_fields.append("FirstName = ?")
            params.append(data['firstName'])
        
        if 'lastName' in data:
            update_fields.append("Last Name = ?")
            params.append(data['lastName'])
        
        if not update_fields:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        # Add user_id for WHERE clause
        params.append(session['user_id'])
        
        query = f"UPDATE User SET {', '.join(update_fields)} WHERE UserID = ?"
        cursor.execute(query, params)
        conn.commit()
        
        # Log the change
        log_audit_event(
            session['user_id'], 
            'PROFILE_UPDATE', 
            'User', 
            session['user_id'],
            f'Updated profile fields: {", ".join(data.keys())}'
        )
        
        return jsonify({
            'success': True, 
            'message': 'Profile updated successfully'
        })
        
    except Exception as e:
        logger.error(f"Error updating profile for user {session['user_id']}: {e}")
        return jsonify({'error': f'Failed to update profile: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/my-profile/request-private-access', methods=['POST'])
@auth_required
def request_private_access():
    """Allow public users to request private access"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get current user info
        cursor.execute("SELECT Role, IsApproved, Username, FirstName, \"Last Name\" FROM User WHERE UserID = ?", (session['user_id'],))
        user = cursor.fetchone()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        current_role, is_approved, username, first_name, last_name = user
        
        # Check if user is already private or has already requested private access
        if current_role == 'private':
            if is_approved:
                return jsonify({'error': 'You already have private access'}), 400
            else:
                return jsonify({'error': 'Your private access request is already pending approval'}), 400
        
        # Check if user is admin (admins don't need to request private access)
        if current_role == 'admin':
            return jsonify({'error': 'Administrators already have full access'}), 400
        
        # Update user to private role but not approved (pending)
        cursor.execute("""
            UPDATE User 
            SET Role = 'private', IsApproved = FALSE 
            WHERE UserID = ?
        """, (session['user_id'],))
        conn.commit()
        
        # Log the request
        log_audit_event(
            session['user_id'], 
            'PRIVATE_ACCESS_REQUEST', 
            'User', 
            session['user_id'],
            f'User {username} ({first_name} {last_name}) requested private access'
        )
        
        # Update session to reflect the change
        session['user_role'] = 'private'
        
        return jsonify({
            'success': True, 
            'message': 'Private access request submitted successfully. An administrator will review your request.'
        })
        
    except Exception as e:
        logger.error(f"Error processing private access request for user {session['user_id']}: {e}")
        return jsonify({'error': f'Failed to submit request: {str(e)}'}), 500
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
            "SELECT Username FROM User WHERE UserID = ? AND (Email IS NULL OR Email = '')",
            (user_id,
             ))
        result = cursor.fetchone()
        if not result:
            return jsonify(
                {'error': 'User not found or email is set. Use standard reset instead.'}), 404

        # Hash new password and update
        hashed = hash_password(new_password)
        cursor.execute("""
            UPDATE User
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


@app.route('/api/recognition-types/old', methods=['GET'])
@auth_required
def get_old_recognition_types():
    """List all recognition types (legacy table)"""
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


@app.route('/api/fiscal-years', methods=['GET'])
@auth_required
def get_fiscal_years():
    """List all fiscal years"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT FiscalYearID, YearLabel FROM FiscalYear ORDER BY YearLabel DESC")
        years = [{'id': row[0], 'label': row[1]} for row in cursor.fetchall()]
        return jsonify(years)
    except Exception as e:
        return jsonify({'error': f'Failed to fetch fiscal years: {str(e)}'}), 500
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
        fiscal_year_id = data.get('fiscalYearId')
        fiscal_year_label = data.get('fiscalYearLabel')
        # Validate fiscal year: must be in format 'YYYY-YYYY' and start >= 1825
        if fiscal_year_label:
            match = re.match(r'^(\d{4})-(\d{4})$', fiscal_year_label)
            if not match:
                return jsonify({'error': 'Fiscal year label must be in format YYYY-YYYY'}), 400
            start_year = int(match.group(1))
            if start_year < 1825:
                return jsonify({'error': 'Fiscal year cannot start before 1825'}), 400
            # Check if fiscal year exists
            cursor.execute("SELECT FiscalYearID FROM FiscalYear WHERE YearLabel = ?", (fiscal_year_label,))
            row = cursor.fetchone()
            if row:
                fiscal_year_id = row[0]
            else:
                cursor.execute("INSERT INTO FiscalYear (YearLabel) VALUES (?)", (fiscal_year_label,))
                fiscal_year_id = cursor.lastrowid
                conn.commit()
        # Insert recognition
        cursor.execute("""
            INSERT INTO Recognitions (SocietyID, RecognitionTypeID, Description, FiscalYearID, IsActive)
            VALUES (?, ?, ?, ?, ?)
        """, (
            society_id,
            data.get('recognitionTypeId'),
            data.get('description'),
            fiscal_year_id,
            data.get('isActive', True)
        ))
        conn.commit()

        cursor.execute("SELECT last_insert_rowid()")
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
    import logging
    logging.basicConfig(level=logging.INFO)
    logging.info(f"Session contents at update: {dict(session)}")
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
            LEFT JOIN User u ON s.UserID = u.UserID
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

    # Connect to SQLite DB
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Insert into User table (not Users)
        # Use userID if provided, otherwise fall back to firstName for compatibility
        username_to_use = userID if userID else firstName
        
        # Determine initial role and approval status based on private access request
        if requestPrivate:
            role = "private"
            is_approved = False  # Private access requests need approval
        else:
            role = "public"
            is_approved = True   # Public users are auto-approved
        
        cursor.execute("""
            INSERT INTO User (Username, FirstName, "Last Name", Email, PasswordHash, Role, IsApproved, CreatedAt, Preferences)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            username_to_use,  # Username (use userID if provided, else firstName)
            firstName,
            lastName,
            email if email else "",
            hashed_password,
            role,
            is_approved,
            datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            ""                # Preferences (empty string)
        ))
        
        approval_status = "pending approval" if requestPrivate else "approved"
        print(f"Inserted user: {username_to_use}, {firstName}, {lastName}, {email} - Role: {role}, Status: {approval_status}")
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
            LEFT JOIN User u ON s.UserID = u.UserID
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
                settingskey = default_value
                
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
            LEFT JOIN User u ON a.UserID = u.UserID
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
        if first_date:
            # Remove time if present, only return YYYY-MM-DD
            first_registered = first_date.split()[0] if ' ' in first_date else first_date
        else:
            first_registered = None

        cursor.execute("""
            SELECT strftime('%Y', DateJoined) AS Yr, COUNT(*) AS Total
            FROM Members
            WHERE DateJoined IS NOT NULL
            GROUP BY strftime('%Y', DateJoined)
            ORDER BY COUNT(*) DESC
            LIMIT 1
        """)
        peak = cursor.fetchone()
        peak_count = peak[1] if peak else 0

        cursor.execute("SELECT COUNT(*) FROM Members WHERE IsActive = 1")
        row = cursor.fetchone()
        lifetime = row[0] if row is not None else 0

        return jsonify({
            "totalMembers": total,
            "categories": categories,
            "regions": regions,
            "historical": {
                "firstRegistered": first_registered,
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
        cursor.execute("UPDATE Members SET IsActive = 1, DateEnded = NULL WHERE MemberID = ?", 
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
        cursor.execute("UPDATE Members SET IsActive = 0, DateEnded = ? WHERE MemberID = ?", 
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
    q = f"UPDATE Members SET IsActive = 0 WHERE MemberID IN ({','.join(['?'] * len(ids))})"
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
        cursor.execute("SELECT COUNT(*) FROM Members WHERE IsActive = 1")
        row = cursor.fetchone()
        active_members = row[0] if row is not None else 0
        cursor.execute("SELECT COUNT(*) FROM Members WHERE IsActive = 0")
        row = cursor.fetchone()
        inactive_members = row[0] if row is not None else 0
        try:
            cursor.execute("SELECT COUNT(*) FROM Society")
            row = cursor.fetchone()
            total_societies = row[0] if row is not None else 0
        except sqlite3.OperationalError:
            # Society table doesn't exist, set to 0
            total_societies = 0
        cursor.execute("SELECT COUNT(*) FROM User WHERE IsApproved = 1")
        row = cursor.fetchone()
        active_users = row[0] if row is not None else 0
        # Recent activities (last 30 days) - New approach using CreatedAt
        recent_activities = []
        thirty_days_ago = datetime.now() - timedelta(days=30)
        
        # New members added to system (using CreatedAt)
        cursor.execute("""
            SELECT FirstName, LastName, CreatedAt, 'member_added' as activity_type
            FROM Members
            WHERE CreatedAt >= ? 
            ORDER BY CreatedAt DESC
            LIMIT 10
        """, (thirty_days_ago.strftime('%Y-%m-%d %H:%M:%S'),))
        
        for row in cursor.fetchall():
            recent_activities.append({
                'type': 'member_added',
                'name': f"{row[0]} {row[1]}",
                'date': row[2][:10] if row[2] else None,  # Extract date part
                'description': f"New member {row[0]} {row[1]} added to system"
            })
        
        # New user registrations (using CreatedAt)
        cursor.execute("""
            SELECT FirstName, "Last Name", CreatedAt, 'user_registered' as activity_type, Role
            FROM User
            WHERE CreatedAt >= ? AND CreatedAt IS NOT NULL AND CreatedAt != ''
            ORDER BY CreatedAt DESC
            LIMIT 5
        """, (thirty_days_ago.strftime('%Y-%m-%d %H:%M:%S'),))
        
        for row in cursor.fetchall():
            if row[2]:  # Only if CreatedAt is not empty
                recent_activities.append({
                    'type': 'user_registered',
                    'name': f"{row[0] or ''} {row[1] or ''}".strip() or row[3],
                    'date': row[2][:10] if row[2] else None,
                    'description': f"New {row[4]} user registered"
                })
        
        # Sort all activities by date (most recent first)
        recent_activities.sort(key=lambda x: x['date'] or '1900-01-01', reverse=True)
        recent_activities = recent_activities[:10]  # Limit to 10 most recent
        
        # Generate Smart Notifications
        smart_notifications = []
        
        # 1. Pending user approvals
        cursor.execute("SELECT COUNT(*) FROM User WHERE IsApproved = 0")
        pending_approvals = cursor.fetchone()[0] or 0
        if pending_approvals > 0:
            smart_notifications.append({
                'type': 'warning',
                'icon': '🔍',
                'message': f"{pending_approvals} user registration{'s' if pending_approvals != 1 else ''} pending approval",
                'action': '/admin/approvals',
                'actionText': 'Review Now'
            })
        
        # 2. Recent database growth
        if len(recent_activities) > 5:
            smart_notifications.append({
                'type': 'info',
                'icon': '📈',
                'message': f"High activity: {len(recent_activities)} recent actions in the system",
                'action': None,
                'actionText': None
            })
        
        # 3. Members with missing email addresses
        cursor.execute("SELECT COUNT(*) FROM Members WHERE IsActive = 1 AND (Email IS NULL OR Email = '')")
        members_no_email = cursor.fetchone()[0] or 0
        if members_no_email > 0:
            smart_notifications.append({
                'type': 'warning',
                'icon': '📧',
                'message': f"{members_no_email} active member{'s' if members_no_email != 1 else ''} missing email address",
                'action': '/members',
                'actionText': 'Update Members'
            })
        
        # 4. System backup reminder (if it's been more than 7 days since last member was added)
        cursor.execute("""
            SELECT CreatedAt FROM Members 
            WHERE CreatedAt IS NOT NULL 
            ORDER BY CreatedAt DESC 
            LIMIT 1
        """)
        last_member_added = cursor.fetchone()
        if last_member_added and last_member_added[0]:
            try:
                last_date = datetime.strptime(last_member_added[0][:10], '%Y-%m-%d')
                if (datetime.now() - last_date).days > 7:
                    smart_notifications.append({
                        'type': 'info',
                        'icon': '💾',
                        'message': "Consider backing up your membership database",
                        'action': None,
                        'actionText': None
                    })
            except:
                pass
        
        # 5. Data quality check - members without birth dates
        cursor.execute("SELECT COUNT(*) FROM Members WHERE IsActive = 1 AND ([Date of Birth] IS NULL OR [Date of Birth] = '')")
        members_no_birth_date = cursor.fetchone()[0] or 0
        if members_no_birth_date > 10:  # Only notify if significant number
            smart_notifications.append({
                'type': 'info',
                'icon': '📋',
                'message': f"{members_no_birth_date} active members missing birth date information",
                'action': '/members',
                'actionText': 'Review Data'
            })
        
        # 6. Welcome message for new admin sessions
        if len(recent_activities) == 0:
            smart_notifications.append({
                'type': 'success',
                'icon': '👋',
                'message': "Welcome! Your membership system is ready to use",
                'action': '/members/new',
                'actionText': 'Add First Member'
            })
        
        # Limit to 4 most relevant notifications
        smart_notifications = smart_notifications[:4]
        # Compose stats
        stats = {
            'activeMembers': active_members,
            'inactiveMembers': inactive_members,
            'totalSocieties': total_societies,
            'activeUsers': active_users,
        }
        
        # Get actual admin user info from database
        cursor.execute("""
            SELECT FirstName, "Last Name", Username
            FROM User
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
            'recentActivities': recent_activities,
            'smartNotifications': smart_notifications,
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
        # Get filters from query params
        category = request.args.get('category', '').strip()
        start_date = request.args.get('startDate', '').strip()
        end_date = request.args.get('endDate', '').strip()

        # Map category string to SQL condition
        category_map = {
            'Active': 'IsActive = 1',
            'Inactive': 'IsActive = 0',
            'Deceased': 'IsActive = 0',  # Treat deceased as inactive
            'Honorary': 'IsHonorary = 1'
        }
        category_condition = category_map.get(category, None)

        # Build WHERE clause
        where_clauses = []
        params = []
        if category_condition:
            where_clauses.append(category_condition)
        if start_date:
            where_clauses.append('DateJoined >= ?')
            params.append(start_date)
        if end_date:
            where_clauses.append('DateJoined <= ?')
            params.append(end_date)
        where_sql = ('WHERE ' + ' AND '.join(where_clauses)) if where_clauses else ''

        # Total members (with filters)
        cursor.execute(f"SELECT COUNT(*) FROM Members {where_sql}", params)
        row = cursor.fetchone()
        total = row[0] if row is not None else 0

        # Pie chart breakdown (filtered)
        # Active
        cursor.execute(f"SELECT COUNT(*) FROM Members WHERE IsActive = 1 {(('AND ' + ' AND '.join(where_clauses)) if where_clauses else '')}", params)
        row = cursor.fetchone()
        active_members = row[0] if row is not None else 0
        # Inactive
        cursor.execute(f"SELECT COUNT(*) FROM Members WHERE IsActive = 0 {(('AND ' + ' AND '.join(where_clauses)) if where_clauses else '')}", params)
        row = cursor.fetchone()
        inactive_members = row[0] if row is not None else 0
        # Deceased (same as inactive)
        deceased_members = inactive_members
        # Honorary
        try:
            cursor.execute(f"SELECT COUNT(*) FROM Members WHERE IsHonorary = 1 {(('AND ' + ' AND '.join(where_clauses)) if where_clauses else '')}", params)
            row = cursor.fetchone()
            honorary_members = row[0] if row is not None else 0
        except Exception:
            honorary_members = 0

        # Yearly breakdown (filtered)
        yearly = {}
        for y in range(datetime.now().year - 4, datetime.now().year + 1):
            year_clauses = list(where_clauses)
            year_params = list(params)
            year_clauses.append("strftime('%Y', DateJoined) = ?")
            year_params.append(str(y))
            year_sql = 'WHERE ' + ' AND '.join(year_clauses)
            cursor.execute(f"SELECT COUNT(*) FROM Members {year_sql}", year_params)
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
            'breakdown': {
                'active': active_members,
                'inactive': inactive_members,
                'deceased': deceased_members,
                'honorary': honorary_members
            },
            'yearly': yearly
        })
    except Exception as e:
        return jsonify({'error': f'Failed to fetch stats: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/stats', methods=['GET'])
@private_or_admin_required
def get_stats():
    """Public stats endpoint for private and admin users - same data as admin stats, now supports filters"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        # Get filters from query params
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        category = request.args.get('category')
        print(f"[DEBUG] Received filters: startDate={start_date}, endDate={end_date}, category={category}")

        # Build WHERE clauses
        where_clauses = []
        params = []
        if start_date:
            where_clauses.append("DateJoined >= ?")
            params.append(start_date)
        if end_date:
            where_clauses.append("DateJoined <= ?")
            params.append(end_date)
        if category:
            if category.lower() == "active":
                where_clauses.append("IsActive = 1")
            elif category.lower() == "inactive":
                where_clauses.append("IsActive = 0")
            elif category.lower() == "deceased":
                where_clauses.append("IsDeceased = 1")

        where_sql = f" WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
        print(f"[DEBUG] WHERE SQL: {where_sql}, params: {params}")

        # Total members (with filters)
        print(f"[DEBUG] Total SQL: SELECT COUNT(*) FROM Members{where_sql}, params: {params}")
        cursor.execute(f"SELECT COUNT(*) FROM Members{where_sql}", params)
        row = cursor.fetchone()
        total = row[0] if row is not None else 0

        # Active
        active_sql = where_sql
        active_params = params.copy()
        if category is None or category.lower() != "active":
            # Only add IsActive filter if not already filtered by category
            active_sql = f"{where_sql} {'AND' if where_sql else 'WHERE'} IsActive = 1"
            active_params = params.copy()
        print(f"[DEBUG] Active SQL: SELECT COUNT(*) FROM Members{active_sql}, params: {active_params}")
        cursor.execute(f"SELECT COUNT(*) FROM Members{active_sql}", active_params)
        row = cursor.fetchone()
        active_members = row[0] if row is not None else 0

        # Inactive
        inactive_sql = where_sql
        inactive_params = params.copy()
        if category is None or category.lower() != "inactive":
            inactive_sql = f"{where_sql} {'AND' if where_sql else 'WHERE'} IsActive = 0"
            inactive_params = params.copy()
        print(f"[DEBUG] Inactive SQL: SELECT COUNT(*) FROM Members{inactive_sql}, params: {inactive_params}")
        cursor.execute(f"SELECT COUNT(*) FROM Members{inactive_sql}", inactive_params)
        row = cursor.fetchone()
        inactive_members = row[0] if row is not None else 0

        # Deceased
        deceased_sql = where_sql
        deceased_params = params.copy()
        if category is None or category.lower() != "deceased":
            deceased_sql = f"{where_sql} {'AND' if where_sql else 'WHERE'} IsDeceased = 1"
            deceased_params = params.copy()
        print(f"[DEBUG] Deceased SQL: SELECT COUNT(*) FROM Members{deceased_sql}, params: {deceased_params}")
        cursor.execute(f"SELECT COUNT(*) FROM Members{deceased_sql}", deceased_params)
        row = cursor.fetchone()
        deceased_members = row[0] if row is not None else 0

        # Yearly breakdown (last 5 years, with filters)
        yearly = {}
        for y in range(datetime.now().year - 4, datetime.now().year + 1):
            year_clauses = where_clauses.copy()
            year_params = params.copy()
            year_clauses.append("strftime('%Y', DateJoined) = ?")
            year_params.append(str(y))
            year_sql = f" WHERE {' AND '.join(year_clauses)}" if year_clauses else ""
            print(f"[DEBUG] Yearly SQL ({y}): SELECT COUNT(*) FROM Members{year_sql}, params: {year_params}")
            cursor.execute(f"SELECT COUNT(*) FROM Members{year_sql}", year_params)
            row = cursor.fetchone()
            yearly[str(y)] = row[0] if row is not None else 0

        # Growth calculation
        growth = 0
        if yearly:
            years = sorted(yearly.keys())
            if len(years) > 1 and yearly[years[0]]:
                growth = int(
                    100 * (yearly[years[-1]] - yearly[years[0]]) / yearly[years[0]])
        print(f"[DEBUG] Response: total={total}, growth={growth}, breakdown={{'active': {active_members}, 'inactive': {inactive_members}, 'deceased': {deceased_members}}}, yearly={yearly}")
        return jsonify({
            'total': total,
            'growth': growth,
            'breakdown': {'active': active_members, 'inactive': inactive_members, 'deceased': deceased_members},
            'yearly': yearly
        })
    except Exception as e:
        print(f"[ERROR] Failed to fetch stats: {str(e)}")
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
        cursor.execute("SELECT UserID, Username FROM User")
        results['User'] = [list(row) for row in cursor.fetchall()]
    except Exception as e:
        results['User'] = f"Error: {str(e)}"
    conn.close()
    return jsonify(results)


@app.route('/api/debug/check-tables', methods=['GET'])
def debug_check_tables():
    """Debug endpoint to check what's actually in lookup tables."""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    cursor = conn.cursor()
    results = {}
    
    # Check FiscalYear table
    try:
        cursor.execute("SELECT FiscalYearID, FiscalYear FROM FiscalYear")
        results['FiscalYear'] = [{'id': row[0], 'name': row[1]} for row in cursor.fetchall()]
    except Exception as e:
        results['FiscalYear'] = f"Error: {str(e)}"
    
    # Check MemberCategory table
    try:
        cursor.execute("SELECT CategoryID, CategoryName FROM MemberCategory")
        results['MemberCategory'] = [{'id': row[0], 'name': row[1]} for row in cursor.fetchall()]
    except Exception as e:
        results['MemberCategory'] = f"Error: {str(e)}"
    
    # Check MemberRole table
    try:
        cursor.execute("SELECT RoleID, RoleName FROM MemberRole")
        results['MemberRole'] = [{'id': row[0], 'name': row[1]} for row in cursor.fetchall()]
    except Exception as e:
        results['MemberRole'] = f"Error: {str(e)}"
    
    # Check Society table
    try:
        cursor.execute("SELECT SocietyID, SocietyName FROM Society")
        results['Society'] = [{'id': row[0], 'name': row[1]} for row in cursor.fetchall()]
    except Exception as e:
        results['Society'] = f"Error: {str(e)}"
    
    # Check Occupation table
    try:
        cursor.execute("SELECT OccupationID, OccupationName FROM Occupation")
        results['Occupation'] = [{'id': row[0], 'name': row[1]} for row in cursor.fetchall()]
    except Exception as e:
        results['Occupation'] = f"Error: {str(e)}"
    
    # Check Surname table
    try:
        cursor.execute("SELECT SurnameID, SurnameName FROM Surname")
        results['Surname'] = [{'id': row[0], 'name': row[1]} for row in cursor.fetchall()]
    except Exception as e:
        results['Surname'] = f"Error: {str(e)}"
    
    # Check IrishCounties table
    try:
        cursor.execute("SELECT CountyID, CountyName FROM IrishCounties")
        results['IrishCounties'] = [{'id': row[0], 'name': row[1]} for row in cursor.fetchall()]
    except Exception as e:
        results['IrishCounties'] = f"Error: {str(e)}"
    
    conn.close()
    return jsonify(results)


# User access request endpoints removed - no RequestPrivate field in database


@app.route('/api/my-recognitions', methods=['GET'])
@admin_required
def get_my_recognitions():
    """Get recognitions for the current user's linked member"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        
        # Find member linked to this user (assuming email match or direct link)
        user_id = session['user_id']
        cursor.execute("SELECT Email, FirstName, \"Last Name\" FROM User WHERE UserID = ?", (user_id,))
        user_data = cursor.fetchone()
        
        if not user_data:
            return jsonify([])
        
        user_email = user_data[0]
        
        # Find member by email match
        cursor.execute("""
            SELECT m.MemberID, m.FirstName, m.LastName 
            FROM Members m 
            WHERE m.Email = ? AND m.IsActive = 1
        """, (user_email,))
        
        member_data = cursor.fetchone()
        if not member_data:
            return jsonify([])
        
        member_id = member_data[0]
        
        # Get recognitions for this member
        cursor.execute("""
            SELECT 
                rt.Name, rt.Description, rt.Category, rt.Icon,
                mr.AwardedDate, mr.AwardedBy, mr.Notes
            FROM MemberRecognitions mr
            JOIN RecognitionTypes rt ON mr.RecognitionTypeID = rt.RecognitionTypeID
            WHERE mr.MemberID = ? AND mr.IsActive = 1
            ORDER BY mr.AwardedDate DESC
        """, (member_id,))
        
        recognitions = []
        for row in cursor.fetchall():
            recognitions.append({
                'name': row[0],
                'description': row[1],
                'category': row[2],
                'icon': row[3],
                'awardedDate': row[4],
                'awardedBy': row[5],
                'notes': row[6]
            })
        
        return jsonify(recognitions)
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch recognitions: {str(e)}'}), 500
    finally:
        conn.close()


if __name__ == '__main__':
    app.run(debug=True, port=5000, host='localhost')
