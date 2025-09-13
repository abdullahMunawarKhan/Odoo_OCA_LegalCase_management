# Odoo Legal Case Management System

A comprehensive legal case management system built as an Odoo module. This system helps law firms and legal departments manage cases, hearings, clients, and documents efficiently.

## Features

- Case management with detailed information tracking
- Hearing scheduling and management
- Client information management
- Legal document handling
- Dashboard with key metrics and upcoming events
- Role-based access control

## Requirements

- Python 3.8 or higher
- Odoo 16.0
- PostgreSQL 12 or higher

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/OdooCaseManagement.git
cd OdooCaseManagement
```

### 2. Set Up a Virtual Environment (Recommended)

```bash
python -m venv venv
```

#### Activate the virtual environment

**Windows:**
```bash
venv\Scripts\activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Odoo

Ensure you have a proper `odoo.conf` file. A sample configuration:

```
[options]
addons_path = ./odoo/addons,./custom_addons
admin_passwd = admin
db_host = localhost
db_port = 5432
db_user = odoo
db_password = odoo
http_port = 8069
```

### 5. Create a Database

```bash
python odoo/odoo-bin -c odoo.conf -d legal_case_db -i base --stop-after-init
```

### 6. Install the Legal Case Management Module

```bash
python odoo/odoo-bin -c odoo.conf -d legal_case_db -i legal_case_management
```

## Running the Application

```bash
python odoo/odoo-bin -c odoo.conf -d legal_case_db
```

Access the application at http://localhost:8069

## Usage

1. Log in with the default admin credentials (admin/admin)
2. Navigate to the Legal module from the dashboard
3. Create new cases, hearings, and client records as needed
4. Use the dashboard to monitor upcoming hearings and active cases

## Common Issues and Solutions

### Domain Filter Error in Odoo 16

If you encounter an error like `EvaluationError: Name 'uid' is not defined`, make sure all XML views use `[context.uid]` instead of `[uid]` in domain filters.

### Database Connection Issues

Ensure your PostgreSQL server is running and the credentials in `odoo.conf` are correct.

## License

This project is licensed under the LGPL-3 - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.