package com.wellnest.content.repository;

import com.wellnest.content.model.Tip;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TipRepository extends JpaRepository<Tip, Long> {
}
