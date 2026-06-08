package com.gastrosoftware.gastrosoftware.payment.controller;

import com.gastrosoftware.gastrosoftware.payment.dto.AddPettyCashDTO;
import com.gastrosoftware.gastrosoftware.payment.dto.CloseShiftDTO;
import com.gastrosoftware.gastrosoftware.payment.dto.OpenShiftDTO;
import com.gastrosoftware.gastrosoftware.payment.dto.ProcessPaymentDTO;
import com.gastrosoftware.gastrosoftware.payment.dto.ShiftResponseDTO;
import com.gastrosoftware.gastrosoftware.payment.entity.Payment;
import com.gastrosoftware.gastrosoftware.payment.entity.PettyCash;
import com.gastrosoftware.gastrosoftware.payment.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/payments")
    public ResponseEntity<Payment> processPayment(@Valid @RequestBody ProcessPaymentDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentService.processPayment(dto));
    }

    @PostMapping("/shifts/open")
    public ResponseEntity<ShiftResponseDTO> openShift(@Valid @RequestBody OpenShiftDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentService.openShift(dto));
    }

    @PostMapping("/shifts/{id}/close")
    public ResponseEntity<ShiftResponseDTO> closeShift(@PathVariable Long id, @Valid @RequestBody CloseShiftDTO dto) {
        return ResponseEntity.ok(paymentService.closeShift(id, dto));
    }

    @GetMapping("/shifts/{id}/summary")
    public ResponseEntity<ShiftResponseDTO> getShiftSummary(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.getShiftSummary(id));
    }

    @PostMapping("/shifts/{id}/petty-cash")
    public ResponseEntity<PettyCash> addPettyCash(
            @PathVariable Long id,
            @Valid @RequestBody AddPettyCashDTO dto,
            HttpServletRequest request
    ) {
        Long employeeId = (Long) request.getAttribute("employeeId");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(paymentService.addPettyCash(id, employeeId, dto));
    }
}
