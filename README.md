<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Odoo Legal Case Management System

A comprehensive legal case management system built as an Odoo module. This system helps law firms and legal departments manage cases, hearings, clients, and documents efficiently.

## Recent Enhancements

- **Interactive Dashboard** with color-coded cards for
    - Active Cases
    - Upcoming Hearings
    - Next Hearing Date
    - Overdue Cases
    - Monthly Revenue
- **Kanban View** using dynamic stage-based coloring
- **Demo Data** tailored to the Indian court system
- **Advanced Reporting** with a professional QWeb Case Summary PDF
- **Smart Actions** for one-click navigation (New Case, Schedule Hearing, Calendar, Reports)
- **Computed Metrics** on `legal.case` for real-time insights
- **Role-Based Access Control** with refined groups and record rules


## Features

- Case management with detailed information tracking
- Hearing scheduling and management (calendar integration)
- Client and lawyer management (enhanced partner flags)
- Fixed-fee invoicing and accounting integration
- Document attachment handling via chatter
- Printable Case Summary Report (PDF)
- Dashboard with key metrics and quick actions
- Kanban, list, form, and calendar views
- Role-based security and record rules


## Requirements

- Python 3.8 or higher
- Odoo 16.0 (or compatible with Odoo 18 Community)
- PostgreSQL 12 or higher


## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/Odoo_OCA_LegalCase_management.git
cd Odoo_OCA_LegalCase_management
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

To include demo data:

```bash
python odoo/odoo-bin -c odoo.conf -d legal_case_db -i legal_case_management --load-demo=all
```


## Running the Application

```bash
python odoo/odoo-bin -c odoo.conf -d legal_case_db
```

Access the application at http://localhost:8069

## Usage

1. Log in with the default admin credentials (admin/admin)
2. Navigate to the **Legal** module via the dashboard
3. Use the **Dashboard** for an overview of your practice
4. Create, view, and manage Cases, Hearings, and Attachments
5. Generate a **Case Summary PDF** from any case form

## Common Issues and Solutions

### Domain Filter Error in Odoo 16

If you encounter `EvaluationError: Name 'uid' is not defined`, update XML filters to use `[context.uid]` instead of `[uid]`.

### Database Connection Issues

Ensure your PostgreSQL server is running and credentials in `odoo.conf` are correct.

## License

This project is licensed under the LGPL-3.0. See the LICENSE file for details.

## Contributing

Contributions are welcome! Please submit a Pull Request on GitHub.

