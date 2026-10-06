TAKIVIVU - DONG BO HOTEL (BAN TUNG PHAN)

DA THUC HIEN
1. API cong khai /api/hotels/{hotelId}/physical-inventory tra so phong, tang, loai phong, gia va trang thai quan ly THUC TE tu PhongCuThe va LoaiPhong. Chi cong khai khach san ACTIVE.
2. API /api/hotels/physical-inventory/max-price lay gia lon nhat cua phong vat ly dang hoat dong o khach san ACTIVE.
3. Trang tim kiem ket hop gia lon nhat tu catalog cu va phong vat ly moi (khong lay rieng khach san dang xem).
4. Trang so do khach san va chi tiet loai phong hien thi so phong/tang/gia tu API moi; trang thai UNVERIFIED duoc ghi ro de khong bao sai phong trong.
5. Them trang nha cung cap CHI TIET loai phong voi thong tin loai phong, danh sach phong vat ly, so do theo tang va lien ket sua phong; nut Xem o danh sach loai phong mo trang nay.
6. Mo quyen GET cong khai cho hai API moi trong Spring Security.

CHUA HOAN THANH - KHONG DUOC XEM LA DAT PHONG VAT LY HOAT DONG
- PhongKhachSan/GiuPhong cu chi giu so luong theo loai; khong co phong_cu_the_id. Vi vay khong the suy ra phong 101 co trong theo ngay hay khong tu booking hien tai.
- Chua co transactional lock / booking items cho nhieu phong vat ly trong mot don. UI hien tai van chi thanh toan duoc 1 loai phong theo API cu. Khong gia lap chon phong vat ly de tranh double booking.
- Chua chay kiem thu end-to-end tren MySQL that; chi doi chieu entity va source.
- Can migration SQL + cap nhat Booking Service + Payment Service + hold/confirm/cancel theo phong_cu_the_id, sau do moi bat chon phong va thanh toan nhieu phong.

CAI DAT: Giai nen va chep cac file vao dung duong dan du an goc; khong xoa nhung file khac. Khoi dong lai hotel-service va frontend. Kiem tra DB da co bang phong_cu_the/loai_phong tu ddl-auto/migration.
