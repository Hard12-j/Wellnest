package com.wellnest.trainer.repository;

import com.wellnest.trainer.model.TrainerProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface TrainerProfileRepository extends JpaRepository<TrainerProfile, Long> {

    Optional<TrainerProfile> findByUserId(Long userId);

    /** Pass "" (not null) for filters you don't want to apply. */
    @Query("""
        select t from TrainerProfile t
        where (lower(concat(t.first, ' ', t.last)) like lower(concat('%', :q, '%'))
               or lower(t.specialization) like lower(concat('%', :q, '%')))
          and lower(t.specialization) like lower(concat('%', :spec, '%'))
          and lower(coalesce(t.location, '')) like lower(concat('%', :loc, '%'))
        order by t.verified desc, t.first asc
        """)
    Page<TrainerProfile> search(@Param("q") String q,
                                @Param("spec") String spec,
                                @Param("loc") String loc,
                                Pageable pageable);
}
