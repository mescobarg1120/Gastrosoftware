package com.gastrosoftware.gastrosoftware.payment.service;

import com.gastrosoftware.gastrosoftware.config.entity.Branch;
import com.gastrosoftware.gastrosoftware.config.repository.BranchRepository;
import com.gastrosoftware.gastrosoftware.employee.entity.Employee;
import com.gastrosoftware.gastrosoftware.employee.repository.EmployeeRepository;
import com.gastrosoftware.gastrosoftware.order.entity.Order;
import com.gastrosoftware.gastrosoftware.payment.dto.AddPettyCashDTO;
import com.gastrosoftware.gastrosoftware.payment.dto.CashCountDetailDTO;
import com.gastrosoftware.gastrosoftware.payment.dto.CloseShiftDTO;
import com.gastrosoftware.gastrosoftware.payment.dto.OpenShiftDTO;
import com.gastrosoftware.gastrosoftware.payment.dto.ProcessPaymentDTO;
import com.gastrosoftware.gastrosoftware.payment.dto.ShiftResponseDTO;
import com.gastrosoftware.gastrosoftware.payment.entity.CashCountDetail;
import com.gastrosoftware.gastrosoftware.payment.entity.CashRegisterShift;
import com.gastrosoftware.gastrosoftware.payment.entity.Payment;
import com.gastrosoftware.gastrosoftware.payment.entity.PaymentMethod;
import com.gastrosoftware.gastrosoftware.payment.entity.PaymentStatus;
import com.gastrosoftware.gastrosoftware.payment.entity.PettyCash;
import com.gastrosoftware.gastrosoftware.payment.entity.PettyCashCategory;
import com.gastrosoftware.gastrosoftware.payment.repository.CashCountDetailRepository;
import com.gastrosoftware.gastrosoftware.payment.repository.CashRegisterShiftRepository;
import com.gastrosoftware.gastrosoftware.payment.repository.PaymentMethodRepository;
import com.gastrosoftware.gastrosoftware.payment.repository.PaymentRepository;
import com.gastrosoftware.gastrosoftware.payment.repository.PettyCashRepository;
import com.gastrosoftware.gastrosoftware.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final CashRegisterShiftRepository shiftRepository;
    private final CashCountDetailRepository countDetailRepository;
    private final PettyCashRepository pettyCashRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final BranchRepository branchRepository;
    private final EmployeeRepository employeeRepository;

    public PaymentService(PaymentRepository paymentRepository, CashRegisterShiftRepository shiftRepository, CashCountDetailRepository countDetailRepository, PettyCashRepository pettyCashRepository, PaymentMethodRepository paymentMethodRepository, BranchRepository branchRepository, EmployeeRepository employeeRepository) {
        this.paymentRepository = paymentRepository;
        this.shiftRepository = shiftRepository;
        this.countDetailRepository = countDetailRepository;
        this.pettyCashRepository = pettyCashRepository;
        this.paymentMethodRepository = paymentMethodRepository;
        this.branchRepository = branchRepository;
        this.employeeRepository = employeeRepository;
    }

    public Payment processPayment(ProcessPaymentDTO dto) {
        PaymentMethod method = paymentMethodRepository.findById(dto.getPaymentMethodId())
                .orElseThrow(() -> new ResourceNotFoundException("PaymentMethod", dto.getPaymentMethodId()));

        PaymentStatus status = new PaymentStatus();
        status.setId(1L);

        Payment payment = Payment.builder()
                .order(new Order())
                .paymentMethod(method)
                .paymentStatus(status)
                .amount(dto.getAmount())
                .transactionRef(dto.getTransactionRef())
                .paidAt(LocalDateTime.now())
                .build();

        payment.getOrder().setId(dto.getOrderId());
        return paymentRepository.save(payment);
    }

    public ShiftResponseDTO openShift(OpenShiftDTO dto) {
        Branch branch = branchRepository.findById(dto.getBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("Branch", dto.getBranchId()));
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", dto.getEmployeeId()));

        CashRegisterShift shift = CashRegisterShift.builder()
                .branch(branch)
                .employee(employee)
                .openingAmount(dto.getOpeningAmount())
                .status("OPEN")
                .openedAt(LocalDateTime.now())
                .build();

        shift = shiftRepository.save(shift);
        return toShiftResponse(shift);
    }

    public ShiftResponseDTO closeShift(Long shiftId, CloseShiftDTO dto) {
        CashRegisterShift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new ResourceNotFoundException("CashRegisterShift", shiftId));

        List<Payment> shiftPayments = paymentRepository.findByShiftId(shiftId);

        BigDecimal totalCash = shiftPayments.stream()
                .filter(p -> "CASH".equalsIgnoreCase(p.getPaymentMethod().getName()))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCard = shiftPayments.stream()
                .filter(p -> p.getPaymentMethod().getName().toUpperCase().contains("CARD")
                        || p.getPaymentMethod().getName().toUpperCase().contains("DEBIT")
                        || p.getPaymentMethod().getName().toUpperCase().contains("CREDIT"))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalTransfer = shiftPayments.stream()
                .filter(p -> "TRANSFER".equalsIgnoreCase(p.getPaymentMethod().getName()))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal pettyCashTotal = pettyCashRepository.findByShiftId(shiftId).stream()
                .map(PettyCash::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal expectedAmount = shift.getOpeningAmount()
                .add(totalCash)
                .subtract(pettyCashTotal);

        countDetailRepository.deleteByShiftId(shiftId);

        BigDecimal countedAmount = BigDecimal.ZERO;
        for (CashCountDetailDTO detail : dto.getCountDetails()) {
            BigDecimal subtotal = BigDecimal.valueOf(detail.getDenomination())
                    .multiply(BigDecimal.valueOf(detail.getQuantity()))
                    .setScale(2, RoundingMode.HALF_UP);
            countedAmount = countedAmount.add(subtotal);

            countDetailRepository.save(CashCountDetail.builder()
                    .shift(shift)
                    .denomination(detail.getDenomination())
                    .quantity(detail.getQuantity())
                    .build());
        }

        BigDecimal difference = countedAmount.subtract(expectedAmount);

        shift.setExpectedAmount(expectedAmount);
        shift.setCountedAmount(countedAmount);
        shift.setDifference(difference);
        shift.setStatus("CLOSED");
        shift.setClosedAt(LocalDateTime.now());
        shiftRepository.save(shift);

        return toShiftResponse(shift);
    }

    @Transactional(readOnly = true)
    public ShiftResponseDTO getShiftSummary(Long shiftId) {
        CashRegisterShift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new ResourceNotFoundException("CashRegisterShift", shiftId));

        return toShiftResponse(shift);
    }

    public PettyCash addPettyCash(Long shiftId, Long employeeId, AddPettyCashDTO dto) {
        CashRegisterShift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new ResourceNotFoundException("CashRegisterShift", shiftId));
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));

        PettyCashCategory category = new PettyCashCategory();
        category.setId(dto.getCategoryId());

        PettyCash pettyCash = PettyCash.builder()
                .branch(shift.getBranch())
                .shift(shift)
                .employee(employee)
                .category(category)
                .description(dto.getDescription())
                .amount(dto.getAmount())
                .voucherRef(dto.getVoucherRef())
                .createdAt(LocalDateTime.now())
                .build();

        return pettyCashRepository.save(pettyCash);
    }

    private ShiftResponseDTO toShiftResponse(CashRegisterShift shift) {
        return ShiftResponseDTO.builder()
                .id(shift.getId())
                .branchId(shift.getBranch().getId())
                .branchName(shift.getBranch().getName())
                .employeeId(shift.getEmployee().getId())
                .employeeName(shift.getEmployee().getFullName())
                .openingAmount(shift.getOpeningAmount())
                .expectedAmount(shift.getExpectedAmount())
                .countedAmount(shift.getCountedAmount())
                .difference(shift.getDifference())
                .status(shift.getStatus())
                .openedAt(shift.getOpenedAt())
                .closedAt(shift.getClosedAt())
                .build();
    }
}
