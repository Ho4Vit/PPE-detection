package ppe.ppedetectuser.entities;

import jakarta.persistence.*;
import lombok.*;
import ppe.ppedetectuser.entities.enums.ViolationType;

import java.time.LocalDateTime;
import java.util.List;

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

    @Column(name = "violation_url", columnDefinition = "TEXT")
    private String violationUrl;

    @CollectionTable(name = "ppe_violation_types", joinColumns = @JoinColumn(name = "violation_id"))
    @Column(name = "violation_type", nullable = false, length = 50)
    private List<String> violationType;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "duration_seconds", nullable = false)
    private Integer durationSeconds;

    @Column(length = 20)
    @Builder.Default
    private String status = "UNRESOLVED";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by")
    private Users resolvedBy;
}