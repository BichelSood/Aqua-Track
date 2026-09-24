# Local test roster

Password for every seeded account: `DevPass123!`

Log in at http://localhost:3000/auth/login then log out to switch roles.

## Staff

| Role | Name | Unique id | Email | Home |
|---|---|---|---|---|
| Delivery | Suresh Kulkarni | D-01 | d1@aquatrack.local | /delivery/dashboard |
| Delivery | Manoj Bhat | D-02 | d2@aquatrack.local | /delivery/dashboard |
| Washing | Local Washing Staff | | washing@aquatrack.local | /washing/dashboard |
| Admin | Local Admin | | admin@aquatrack.local | /admin/dashboard |

## How to test scans

1. **Collection (H1)** — log in as `d1@aquatrack.local`, start the H1 pickup, open `/delivery/scan`. Scan the QR (open `supabase/local-test-qrs.html`) or type the roll number / bag code. All 10 H1 bags have no active order.
2. **Washing (H2)** — log in as `washing@aquatrack.local`, open `/washing/scan`. H2-001/002 collected, H2-003/004 at facility, H2-005/006 under washing. H2-007–010 are still free to collect if you start from delivery.
3. **Delivery (H3)** — log in as `d2@aquatrack.local`, open `/delivery/scan`. H3-001–004 ready, H3-005–007 out for delivery, H3-008 attempted, H3-009/010 already delivered.
4. **Wrong hostel** — scan an H3 QR while D-01’s H1 pickup is active; it should be rejected.

## Students

| Hostel | Name | Roll | Email | Room | Phone | Bag | QR token | Active status |
|---|---|---|---|---|---|---|---|---|
| H1 | Aisha Rahman | H1-001 | h1.01@aquatrack.local | H1-101 | 9011000001 | BAG-H1-01 | `1ad4de5b147742edb1855169d9fff09c` | none |
| H1 | Kabir Sharma | H1-002 | h1.02@aquatrack.local | H1-102 | 9011000002 | BAG-H1-02 | `658c1c74e6cb426db5e32f74957f68c4` | none |
| H1 | Meera Iyer | H1-003 | h1.03@aquatrack.local | H1-103 | 9011000003 | BAG-H1-03 | `c5094f85227d4349842674de921843ad` | none |
| H1 | Dev Patel | H1-004 | h1.04@aquatrack.local | H1-104 | 9011000004 | BAG-H1-04 | `d2280aebc90444efba787f6cd8da187a` | none |
| H1 | Sana Khan | H1-005 | h1.05@aquatrack.local | H1-105 | 9011000005 | BAG-H1-05 | `71e04991f54f40a4a2557cdd879e1c44` | none |
| H1 | Rohan Gupta | H1-006 | h1.06@aquatrack.local | H1-106 | 9011000006 | BAG-H1-06 | `b4534d19562141e486f31133234eb99f` | none |
| H1 | Nisha Verma | H1-007 | h1.07@aquatrack.local | H1-107 | 9011000007 | BAG-H1-07 | `0ded2749eb204b2c8b7c3afb315e212d` | none |
| H1 | Aditya Joshi | H1-008 | h1.08@aquatrack.local | H1-108 | 9011000008 | BAG-H1-08 | `8112ba9d69294945b8b2e9c7c15d368c` | none |
| H1 | Priya Nair | H1-009 | h1.09@aquatrack.local | H1-109 | 9011000009 | BAG-H1-09 | `54701004dc194fbe9c5644ad965ebaf8` | none |
| H1 | Vikram Rao | H1-010 | h1.10@aquatrack.local | H1-110 | 9011000010 | BAG-H1-10 | `a6e59c7477b04f739f75a924490ae37a` | none |
| H2 | Ananya Das | H2-001 | h2.01@aquatrack.local | H2-101 | 9021000001 | BAG-H2-01 | `9564613524504fde812f9e06dce9a841` | COLLECTED |
| H2 | Farhan Ali | H2-002 | h2.02@aquatrack.local | H2-102 | 9021000002 | BAG-H2-02 | `9de004384ee6417e848531548bd180c8` | COLLECTED |
| H2 | Kavya Reddy | H2-003 | h2.03@aquatrack.local | H2-103 | 9021000003 | BAG-H2-03 | `376728e9441444f58718a0945f97a221` | RECEIVED_AT_FACILITY |
| H2 | Ishaan Malhotra | H2-004 | h2.04@aquatrack.local | H2-104 | 9021000004 | BAG-H2-04 | `d8990d1a6953448db69d2fac4dbfdd1a` | RECEIVED_AT_FACILITY |
| H2 | Tara Singh | H2-005 | h2.05@aquatrack.local | H2-105 | 9021000005 | BAG-H2-05 | `2fbfe709ee944bc69908c07b5e9e811c` | UNDER_WASHING |
| H2 | Nikhil Bose | H2-006 | h2.06@aquatrack.local | H2-106 | 9021000006 | BAG-H2-06 | `d183d7607a7d4d6eadc197c5f40dcc42` | UNDER_WASHING |
| H2 | Riya Kapoor | H2-007 | h2.07@aquatrack.local | H2-107 | 9021000007 | BAG-H2-07 | `43c6c23c744b45eab7e54a3989193473` | none |
| H2 | Sameer Qureshi | H2-008 | h2.08@aquatrack.local | H2-108 | 9021000008 | BAG-H2-08 | `479d6f6987474fe0841beb3479a5b077` | none |
| H2 | Diya Menon | H2-009 | h2.09@aquatrack.local | H2-109 | 9021000009 | BAG-H2-09 | `e917f232cabf46139bb877321e544982` | none |
| H2 | Arnav Pillai | H2-010 | h2.10@aquatrack.local | H2-110 | 9021000010 | BAG-H2-10 | `4cfa2e5f61764955985ee99b555f5e87` | none |
| H3 | Zara Hussain | H3-001 | h3.01@aquatrack.local | H3-101 | 9031000001 | BAG-H3-01 | `a7584295957b4894aa849fe37794a739` | READY_FOR_DELIVERY |
| H3 | Kunal Mehta | H3-002 | h3.02@aquatrack.local | H3-102 | 9031000002 | BAG-H3-02 | `5bc1fc7564d845809cb0285cbd487ecf` | READY_FOR_DELIVERY |
| H3 | Lila Fernandes | H3-003 | h3.03@aquatrack.local | H3-103 | 9031000003 | BAG-H3-03 | `d8b7b30d5a034acc812496f3a0d36336` | READY_FOR_DELIVERY |
| H3 | Harsh Vardhan | H3-004 | h3.04@aquatrack.local | H3-104 | 9031000004 | BAG-H3-04 | `a1aab7da7f31483f8a763369340834ce` | READY_FOR_DELIVERY |
| H3 | Pooja Kulkarni | H3-005 | h3.05@aquatrack.local | H3-105 | 9031000005 | BAG-H3-05 | `93d46db7944e4f7785970340d92ade6e` | OUT_FOR_DELIVERY |
| H3 | Yash Banerjee | H3-006 | h3.06@aquatrack.local | H3-106 | 9031000006 | BAG-H3-06 | `52cb2f8004844b8c9db420f57f5cbc10` | OUT_FOR_DELIVERY |
| H3 | Anika Chawla | H3-007 | h3.07@aquatrack.local | H3-107 | 9031000007 | BAG-H3-07 | `fe1b59d099684f6799946aa186b03657` | OUT_FOR_DELIVERY |
| H3 | Rehan Sheikh | H3-008 | h3.08@aquatrack.local | H3-108 | 9031000008 | BAG-H3-08 | `804942ffc6a04649a69389687ff4fd84` | DELIVERY_ATTEMPTED |
| H3 | Myra Dsouza | H3-009 | h3.09@aquatrack.local | H3-109 | 9031000009 | BAG-H3-09 | `defa791a70be4a7da3b46fc19d2354ce` | none |
| H3 | Varun Krishnan | H3-010 | h3.10@aquatrack.local | H3-110 | 9031000010 | BAG-H3-10 | `ed53d8689956475786e5911a4fbb7625` | none |

Machine-readable copy: `supabase/local-test-roster.csv`.
