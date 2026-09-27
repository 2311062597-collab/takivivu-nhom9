package com.example.aiservice.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    private final RestClient restClient;

    @Value("${gemini.api-key}")
    private String apiKey;

    @Value("${gemini.model}")
    private String model;

    @Value("${gemini.base-url}")
    private String baseUrl;

    public GeminiService() {
        this.restClient = RestClient.create();
    }

    @SuppressWarnings("unchecked")
    public String generate(String prompt) {

        kiemTraApiKey();

        String url =
                baseUrl
                        + "/models/"
                        + model
                        + ":generateContent";

        Map<String, Object> body =
                Map.of(
                        "contents",
                        List.of(
                                Map.of(
                                        "role",
                                        "user",
                                        "parts",
                                        List.of(
                                                Map.of(
                                                        "text",
                                                        prompt
                                                )
                                        )
                                )
                        )
                );

        try {

            Map<String, Object> response =
                    restClient
                            .post()
                            .uri(url)
                            .header(
                                    "x-goog-api-key",
                                    apiKey
                            )
                            .body(body)
                            .retrieve()
                            .body(Map.class);

            if (response == null) {
                throw new RuntimeException(
                        "Gemini không trả về dữ liệu."
                );
            }

            List<Map<String, Object>> candidates =
                    (List<Map<String, Object>>)
                            response.get("candidates");

            if (candidates == null
                    || candidates.isEmpty()) {

                throw new RuntimeException(
                        "Gemini không trả về câu trả lời."
                );
            }

            Map<String, Object> content =
                    (Map<String, Object>)
                            candidates
                                    .getFirst()
                                    .get("content");

            if (content == null) {
                throw new RuntimeException(
                        "Gemini không trả về nội dung."
                );
            }

            List<Map<String, Object>> parts =
                    (List<Map<String, Object>>)
                            content.get("parts");

            if (parts == null
                    || parts.isEmpty()) {

                throw new RuntimeException(
                        "Gemini không trả về nội dung."
                );
            }

            Object text =
                    parts
                            .getFirst()
                            .get("text");

            if (text == null) {

                throw new RuntimeException(
                        "Gemini không trả về nội dung."
                );
            }

            return text
                    .toString()
                    .trim();

        } catch (RuntimeException e) {

            throw e;

        } catch (Exception e) {

            throw new RuntimeException(
                    "Hiện chưa thể kết nối Gemini. Vui lòng thử lại sau."
            );
        }
    }

    private void kiemTraApiKey() {

        if (apiKey == null
                || apiKey.isBlank()
                || "YOUR_GEMINI_API_KEY"
                .equals(apiKey)) {

            throw new RuntimeException(
                    "Gemini API Key chưa được cấu hình."
            );
        }
    }
}