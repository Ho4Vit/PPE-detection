package ppe.ppedetectuser.entities;


import jakarta.persistence.*;
import lombok.*;
import ppe.ppedetectuser.entities.enums.ViolationType;

import java.time.LocalDateTime;

@Entity
@Table(name = "ppe_violations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PpeViolation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "camera_id", nullable = false)
    private Camera camera;

    @Enumerated(EnumType.STRING)
    @Column(name = "violation_type", nullable = false, length = 50)
    private ViolationType violationType; // e.g., "NO_HELMET", "NO_VEST", "NO_SHOES"

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "duration_seconds", nullable = false)
    private Integer durationSeconds;

    @Column(length = 20)
    private String status = "UNRESOLVED"; // UNRESOLVED, RESOLVED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by")
    private Users resolvedBy;
}