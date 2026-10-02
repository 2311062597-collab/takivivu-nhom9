package com.example.hotelservice.dto;

import com.example.hotelservice.entity.TrangThaiKhachSan;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class KhachSanResponseDTO {

    private Long id;

    private Long nhaCungCapId;

    private String tenKhachSan;

    private String moTa;

    private String diaChi;

    private String thanhPho;

    private String soDienThoai;

    private String email;

    private String hinhAnh;

    private BigDecimal viDo;

    private BigDecimal kinhDo;

    private Integer soSao;

    private Integer soTang;

    private TrangThaiKhachSan trangThai;

    private List<PhongResponseDTO> danhSachPhong;

    private String quanHuyen;
    private String tienNghi;
    private String anhGioiThieu;

    // Thêm trường không làm thay đổi constructor cũ trong HotelService.
    private String anhThuVien;

    public KhachSanResponseDTO(Long id, Long nhaCungCapId, String tenKhachSan, String moTa, String diaChi, String thanhPho, String soDienThoai, String email, String hinhAnh, BigDecimal viDo, BigDecimal kinhDo, Integer soSao, Integer soTang, TrangThaiKhachSan trangThai, List<PhongResponseDTO> danhSachPhong, String quanHuyen, String tienNghi, String anhGioiThieu) {
        this.id=id; this.nhaCungCapId=nhaCungCapId; this.tenKhachSan=tenKhachSan; this.moTa=moTa; this.diaChi=diaChi; this.thanhPho=thanhPho; this.soDienThoai=soDienThoai; this.email=email; this.hinhAnh=hinhAnh; this.viDo=viDo; this.kinhDo=kinhDo; this.soSao=soSao; this.soTang=soTang; this.trangThai=trangThai; this.danhSachPhong=danhSachPhong; this.quanHuyen=quanHuyen; this.tienNghi=tienNghi; this.anhGioiThieu=anhGioiThieu;
    }
}