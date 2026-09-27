package com.example.aiservice.service;

import com.example.aiservice.dto.AiResponseDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class AiService {

    private final GeminiService geminiService;
    private final RestClient restClient;

    @Value("${service.flight.url}")
    private String flightUrl;

    @Value("${service.hotel.url}")
    private String hotelUrl;

    @Value("${service.attraction.url}")
    private String attractionUrl;

    @Value("${service.booking.url}")
    private String bookingUrl;

    @Value("${service.payment.url}")
    private String paymentUrl;

    public AiService(
            GeminiService geminiService
    ) {

        this.geminiService =
                geminiService;

        this.restClient =
                RestClient.create();
    }

    // =========================================================
    // CHAT CHUNG
    // =========================================================

    public AiResponseDTO chat(
            String message
    ) {

        String cauHoi =
                chuanHoa(message);

        String prompt =
                taoSystemPrompt()
                        + """

                        Câu hỏi của người dùng:
                        %s

                        Hãy trả lời bằng tiếng Việt.
                        Nếu người dùng yêu cầu AI tự đặt dịch vụ,
                        tự thanh toán, tự hủy hoặc tự hoàn tiền,
                        phải từ chối thực hiện hành động và chỉ
                        hướng dẫn họ tới chức năng chính thức.
                        """.formatted(cauHoi);

        String answer =
                geminiService.generate(
                        prompt
                );

        return new AiResponseDTO(
                answer,
                "CHAT",
                false,
                null
        );
    }

    // =========================================================
    // RECOMMEND
    // =========================================================

    public AiResponseDTO recommend(
            String message
    ) {

        String cauHoi =
                chuanHoa(message);

        /*
         * Dữ liệu công khai hiện tại từ các service.
         *
         * AI chỉ dùng dữ liệu service trả về làm
         * nguồn tham khảo. Không tự thay đổi inventory.
         */
        Object flights =
                layDuLieuCongKhai(
                        flightUrl
                                + "/api/flights/internal/catalog"
                );

        Object hotels =
                layDuLieuCongKhai(
                        hotelUrl
                                + "/api/hotels/internal/catalog"
                );

        Object attractions =
                layDuLieuCongKhai(
                        attractionUrl
                                + "/api/attractions/internal/catalog"
                );

        String prompt =
                taoSystemPrompt()
                        + """

                        Người dùng cần tư vấn du lịch:

                        %s

                        Dữ liệu chuyến bay hiện có:
                        %s

                        Dữ liệu khách sạn hiện có:
                        %s

                        Dữ liệu địa điểm tham quan hiện có:
                        %s

                        Quy tắc bắt buộc:
                        - Chỉ gợi ý dịch vụ thực sự xuất hiện trong dữ liệu trên.
                        - Không tự tạo tên khách sạn, chuyến bay hoặc địa điểm có thể đặt.
                        - Không tự bịa giá.
                        - Không tự bịa số ghế, số phòng hoặc số vé còn lại.
                        - Nếu dữ liệu service không đủ để xác nhận một thông tin,
                          phải nói rõ chưa thể kiểm tra.
                        - Có thể đề xuất người dùng mở trang tìm kiếm hoặc chi tiết
                          để kiểm tra dữ liệu mới nhất.
                        - Không tự tạo Booking.
                        - Trả lời bằng tiếng Việt.
                        """.formatted(
                        cauHoi,
                        toText(flights),
                        toText(hotels),
                        toText(attractions)
                );

        String answer =
                geminiService.generate(
                        prompt
                );

        return new AiResponseDTO(
                answer,
                "RECOMMEND",
                true,
                "/search"
        );
    }

    // =========================================================
    // BOOKING HELP
    // =========================================================

    public AiResponseDTO bookingHelp(
            String message,
            String bookingCode,
            String authorization
    ) {

        String cauHoi =
                chuanHoa(message);

        /*
         * Nếu chưa có Booking cụ thể:
         * chỉ hướng dẫn quy trình.
         */
        if (bookingCode == null
                || bookingCode.isBlank()) {

            String prompt =
                    taoSystemPrompt()
                            + """

                            Người dùng hỏi cách đặt dịch vụ:

                            %s

                            Hãy hướng dẫn theo quy trình TAKIVIVU.

                            Ví dụ với khách sạn:
                            Tìm khách sạn
                            → Chọn phòng
                            → Nhập thông tin khách
                            → Kiểm tra giá/phòng
                            → Tạo Booking
                            → Thanh toán.

                            Nếu chưa xác định được loại dịch vụ,
                            hãy hỏi người dùng muốn đặt chuyến bay,
                            khách sạn hay vé tham quan.

                            Không được tự tạo Booking.
                            Không được tự giữ chỗ.
                            """.formatted(cauHoi);

            return new AiResponseDTO(
                    geminiService.generate(prompt),
                    "BOOKING_HELP",
                    true,
                    "/search"
            );
        }

        /*
         * Có mã Booking thì chỉ đọc thông tin nếu
         * có Authorization.
         */
        if (authorization == null
                || authorization.isBlank()) {

            return new AiResponseDTO(
                    "Bạn cần đăng nhập để kiểm tra Booking cá nhân.",
                    "BOOKING_HELP",
                    true,
                    "/login"
            );
        }

        Object booking =
                layBookingTheoCode(
                        bookingCode,
                        authorization
                );

        String prompt =
                taoSystemPrompt()
                        + """

                        Người dùng hỏi:
                        %s

                        Booking mà hệ thống xác minh được:
                        %s

                        Chỉ giải thích dữ liệu Booking trên.
                        Không thay đổi trạng thái Booking.
                        Không tự hủy Booking.
                        Không tự tạo yêu cầu hoàn tiền.
                        """.formatted(
                        cauHoi,
                        toText(booking)
                );

        return new AiResponseDTO(
                geminiService.generate(prompt),
                "BOOKING_HELP",
                true,
                "/bookings"
        );
    }

    // =========================================================
    // PAYMENT HELP
    // =========================================================

    public AiResponseDTO paymentHelp(
            String bookingCode,
            String authorization
    ) {

        if (bookingCode == null
                || bookingCode.isBlank()) {

            return new AiResponseDTO(
                    "Vui lòng cung cấp mã Booking cần kiểm tra.",
                    "PAYMENT_HELP",
                    false,
                    null
            );
        }

        Object booking =
                layBookingTheoCode(
                        bookingCode,
                        authorization
                );

        Object payment =
                layPaymentTheoBooking(
                        bookingCode,
                        authorization
                );

        String prompt =
                taoSystemPrompt()
                        + """

                        Khách hàng cần hỗ trợ thanh toán.

                        Mã Booking:
                        %s

                        Dữ liệu Booking:
                        %s

                        Dữ liệu Payment:
                        %s

                        Hãy giải thích trạng thái hiện tại.

                        Quy tắc:
                        - PENDING: đang chờ hệ thống đối chiếu.
                        - SUCCESS: chỉ nói đã thanh toán khi Payment Service
                          thực sự trả SUCCESS.
                        - REFUND_PENDING: đang trong quá trình hoàn tiền.
                        - Không tự chuyển Payment sang SUCCESS.
                        - Không tự thay đổi Booking.
                        - Không khẳng định khách đã thanh toán thành công
                          nếu dữ liệu Payment chưa SUCCESS.
                        - Nếu chưa có dữ liệu Payment thì nói chưa thể
                          xác nhận trạng thái thanh toán.
                        """.formatted(
                        bookingCode,
                        toText(booking),
                        toText(payment)
                );

        return new AiResponseDTO(
                geminiService.generate(prompt),
                "PAYMENT_HELP",
                true,
                "/payments"
        );
    }

    // =========================================================
    // CANCEL HELP
    // =========================================================

    public AiResponseDTO cancelHelp(
            String bookingCode,
            String authorization
    ) {

        if (bookingCode == null
                || bookingCode.isBlank()) {

            return new AiResponseDTO(
                    "Vui lòng cung cấp mã Booking bạn muốn kiểm tra điều kiện hủy.",
                    "CANCEL_HELP",
                    false,
                    null
            );
        }

        Object booking =
                layBookingTheoCode(
                        bookingCode,
                        authorization
                );

        String prompt =
                taoSystemPrompt()
                        + """

                        Khách hàng muốn được hỗ trợ hủy Booking.

                        Booking:
                        %s

                        Chỉ được:
                        - Giải thích trạng thái hiện tại.
                        - Giải thích rằng khách phải sử dụng chức năng
                          Hủy đơn chính thức.
                        - Nếu dữ liệu có chính sách/phí hủy thì giải thích
                          đúng dữ liệu đó.

                        Không được:
                        - Tự hủy Booking.
                        - Tự chuyển Booking sang CANCELLED.
                        - Tự tạo Refund.
                        - Tự hứa mức hoàn tiền nếu dữ liệu hệ thống
                          chưa cung cấp chính sách/phí hủy.

                        Khách phải tự xác nhận thao tác hủy
                        trên giao diện chính thức.
                        """.formatted(
                        toText(booking)
                );

        return new AiResponseDTO(
                geminiService.generate(prompt),
                "CANCEL_HELP",
                true,
                "/bookings"
        );
    }

    // =========================================================
    // READ PUBLIC SERVICE
    // =========================================================

    private Object layDuLieuCongKhai(
            String url
    ) {

        try {

            return restClient
                    .get()
                    .uri(url)
                    .retrieve()
                    .body(Object.class);

        } catch (Exception e) {

            /*
             * Theo SRS: nếu service lỗi,
             * AI không được bịa dữ liệu.
             */
            return Map.of(
                    "available",
                    false,
                    "message",
                    "Không thể lấy dữ liệu từ service lúc này"
            );
        }
    }

    // =========================================================
    // READ BOOKING
    // =========================================================

    private Object layBookingTheoCode(
            String bookingCode,
            String authorization
    ) {

        /*
         * Booking Service hiện tại của dự án mới có
         * endpoint chi tiết theo ID.
         *
         * SRS AI lại sử dụng bookingCode.
         *
         * Vì vậy integration cuối sẽ bổ sung endpoint
         * GET /api/bookings/code/{bookingCode}.
         *
         * AI Service đã chuẩn bị đúng URL này.
         */

        try {

            return restClient
                    .get()
                    .uri(
                            bookingUrl
                                    + "/api/bookings/code/"
                                    + bookingCode.trim()
                    )
                    .header(
                            HttpHeaders.AUTHORIZATION,
                            authorization
                    )
                    .retrieve()
                    .body(Object.class);

        } catch (Exception e) {

            throw new RuntimeException(
                    "Không tìm thấy Booking hoặc bạn không có quyền xem Booking này."
            );
        }
    }

    // =========================================================
    // READ PAYMENT
    // =========================================================

    private Object layPaymentTheoBooking(
            String bookingCode,
            String authorization
    ) {

        /*
         * Tương tự, integration cuối sẽ bổ sung
         * GET /api/payments/booking/{bookingCode}
         * cho AI đọc trạng thái theo mã Booking.
         */

        try {

            return restClient
                    .get()
                    .uri(
                            paymentUrl
                                    + "/api/payments/booking/"
                                    + bookingCode.trim()
                    )
                    .header(
                            HttpHeaders.AUTHORIZATION,
                            authorization
                    )
                    .retrieve()
                    .body(Object.class);

        } catch (Exception e) {

            return Map.of(
                    "available",
                    false,
                    "message",
                    "Chưa thể kiểm tra Payment lúc này"
            );
        }
    }

    // =========================================================
    // SYSTEM PROMPT
    // =========================================================

    private String taoSystemPrompt() {

        return """
                Bạn là trợ lý AI của nền tảng du lịch TAKIVIVU.

                Phạm vi của bạn:
                - Tư vấn du lịch.
                - Tư vấn khách sạn.
                - Tư vấn chuyến bay.
                - Tư vấn địa điểm tham quan.
                - Hướng dẫn đặt dịch vụ.
                - Giải thích trạng thái Booking.
                - Giải thích trạng thái Payment.
                - Hướng dẫn hủy đơn.

                NGUYÊN TẮC BẮT BUỘC:

                1. Bạn chỉ tư vấn, tìm kiếm, giải thích và hỗ trợ điều hướng.

                2. Không được tự:
                   - tạo hoặc xác nhận Booking;
                   - thay đổi giá;
                   - giữ ghế;
                   - giữ phòng;
                   - giữ vé tham quan;
                   - xác nhận Payment;
                   - thay đổi paymentStatus;
                   - thay đổi bookingStatus;
                   - hủy Booking;
                   - hoàn tiền.

                3. Giá và số lượng còn lại của dịch vụ phải lấy từ
                   dữ liệu hệ thống cung cấp.

                4. Không được tạo ra khách sạn, chuyến bay hoặc dịch vụ
                   không tồn tại trong dữ liệu hệ thống khi đang giới thiệu
                   dịch vụ có thể đặt.

                5. Nếu service không phản hồi hoặc dữ liệu không đủ,
                   phải nói rằng hiện chưa thể kiểm tra.
                   Không được đoán giá, số lượng hoặc trạng thái.

                6. Với Payment, chỉ được nói thanh toán thành công
                   khi Payment Service trả trạng thái SUCCESS.

                7. Với hủy đơn, chỉ hướng dẫn khách đến chức năng
                   hủy chính thức. Khách hàng phải tự xác nhận.

                Trả lời rõ ràng, ngắn gọn, bằng tiếng Việt.
                """;
    }

    // =========================================================
    // UTIL
    // =========================================================

    private String chuanHoa(
            String text
    ) {

        if (text == null
                || text.isBlank()) {

            throw new IllegalArgumentException(
                    "Nội dung không được để trống."
            );
        }

        return text
                .trim()
                .replaceAll(
                        "\\s+",
                        " "
                );
    }

    private String toText(
            Object value
    ) {

        if (value == null) {
            return "Không có dữ liệu";
        }

        return value.toString();
    }
}