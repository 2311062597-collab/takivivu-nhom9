TAKIVIVU - PATCH 4.3: BO LOCALSTORAGE CHO DU LIEU NGHIEP VU

1) Copy de cac file theo dung thu muc.
2) Chay database/20261005_provider_profile_db.sql tren auth_db hien tai.
3) Restart auth-service va frontend.

Da xu ly:
- Provider Profile: thong tin doanh nghiep luu provider_profiles thay vi localStorage.
- Provider Flight Form: ten hang/nha cung cap doc tu /auth/profile thay vi localStorage.
- Hotel form: bo metadata hotel.extra localStorage; quan/huyen, tien nghi, anh... tiep tuc luu qua Hotel API/DB san co.
- Attraction: bo attraction.extra localStorage; loai dia diem + tien ich + anh dai dien doc/ghi API/DB. Bo rating/review/ngay tao gia lap.
- Ticket: bo ticket.extra localStorage; ten loai ve, doi tuong, mo ta, gia, so luong, ngay hieu luc lay tu Attraction DB; hinh anh ke thua dia diem.
- ProviderRoomForm: bo ghi metadata phong vao localStorage.

Luu y: Anh phu nhieu anh cua Attraction chua co cot gallery trong schema hien tai; patch nay khong tao du lieu gia/localStorage de gia lap gallery. Anh dai dien van luu DB qua hinh_anh.
