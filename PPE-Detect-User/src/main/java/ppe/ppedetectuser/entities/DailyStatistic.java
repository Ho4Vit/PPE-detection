package ppe.ppedetectuser.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(
        name = "daily_statistics",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"stat_date", "camera_id"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyStatistic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "stat_date", nullable = false)
    private LocalDate statDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "camera_id", nullable = false)
    private Camera camera;

    @Column(name = "total_violations")
    private Integer totalViolations = 0;

    @Column(name = "no_helmet_count")
    private Integer noHelmetCount = 0;

    @Column(name = "no_vest_count")
    private Integer noVestCount = 0;

    @Column(name = "no_shoes_count")
    private Integer noShoesCount = 0;
}