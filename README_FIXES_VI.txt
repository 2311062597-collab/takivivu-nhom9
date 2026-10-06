TAKIVIVU - CAC FILE SUA 28/09/2026

CAI DAT
1. Sao luu ma nguon va tat ca database.
2. Giai nen goi patch, chep thu muc takivivu/ de GHI DE cac file trung ten trong source goc dung phien ban takivivu(20260928-122416).zip.
3. Chay 1 LAN file takivivu/database/2026_09_28_cancellation_and_gallery.sql bang MySQL (kiem tra ten DB tren may: booking_db, hotel_db, notification_db). Neu da co index idx_booking_cancel_timeout thi bo qua lenh CREATE INDEX de tranh loi trung.
4. Khoi dong lai backend (booking, payment, flight, hotel, attraction, notification) va frontend. Khong doi INTERNAL TOKEN dung chung giua service.

NOI DUNG SUA
- QR: khach bao chuyen khoan, provider co 3 phut xac nhan; qua han: auto huy, giai phong cho va ghi nhan hoan tien MO PHONG; het han ma khach chua bao chuyen khoan: chi giai phong, khong hoan tien.
- Booking da thanh toan: khach gui ly do huy it nhat 24 gio truoc khi su dung; provider co 2 gio duyet hoac tu choi kem ly do; qua han he thong tu duyet. Khach khong duoc goi thang API Payment de ne quy trinh.
- Dong bo trang thai booking/payment, thong bao khach/provider, giai phong ghe/phong/ve.
- bug.docx: xem tat ca anh khach san, bo yeu thich, upload nhieu anh cho loai phong, tranh anh mac dinh/anh loi, bo sung thong tin tong hop so do phong.

LUU Y THIET KE
- CHI HOAN TIEN MO PHONG, khong thuc hien giao dich ngan hang thuc.
- Khach san va tham quan trong BookingItem chi luu ngay, chua luu gio bat dau. Bo loc 24 gio tinh tu 00:00 ngay su dung (bao thu), ve may bay lay gio khoi hanh.
- Yeu cau huy ap dung cho TOAN BO booking; neu booking gom dich vu cua nhieu provider, can thiet ke bo sung quy trinh phe duyet nhieu provider truoc khi trien khai production.
- Job timeout mac dinh quet 30 giay/lan, nen thoi gian xu ly thuc co the tre den ~30 giay.
- Cac luong PayPal/co che hoan tien cu neu co phai duoc kiem thu rieng; khong nham hoan tien mo phong QR voi hoan tien PayPal that.

KIEM TRA DA THUC HIEN
- TypeScript: node node_modules/typescript/bin/tsc -b --pretty false: PASS.
- Chua the xac nhan Maven build/integration/API voi MySQL va cac service trong moi truong nay. Can kiem thu end-to-end tren may cua ban truoc khi dung.

CAC TEST CAN CHAY
1. Khach khong bao chuyen khoan, qua han: EXPIRED/cho duoc giai phong; KHONG hoan tien.
2. Khach bao chuyen khoan, provider xac nhan trong 3 phut: CONFIRMED/SUCCESS.
3. Provider khong xac nhan: CANCELLED/REFUNDED mo phong, cho duoc giai phong, thong bao 2 phia.
4. Da thanh toan, gui huy >=24h: cho xu ly; provider duyet => huy/hoan/giai phong; tu choi => giu booking va hien ly do.
5. Provider im lang >2h => tu duyet va thong bao.
6. Yeu cau huy <24h, user khac, payment chua thanh cong => tu choi.
7. Upload nhieu anh loai phong, gallery xem anh, so do tang, link anh loi/khong co anh.
