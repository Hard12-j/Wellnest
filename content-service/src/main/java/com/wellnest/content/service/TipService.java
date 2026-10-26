package com.wellnest.content.service;

import com.wellnest.content.dto.TipResponse;
import com.wellnest.content.exception.NotFoundException;
import com.wellnest.content.model.Tip;
import com.wellnest.content.repository.TipRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@Transactional(readOnly = true)
public class TipService {

    private final TipRepository tips;

    public TipService(TipRepository tips) {
        this.tips = tips;
    }

    /** Same tip for everyone all day; rotates daily through the tip table. */
    public TipResponse tipOfTheDay() {
        long count = tips.count();
        if (count == 0) throw new NotFoundException("No tips available");
        int index = (int) (LocalDate.now().toEpochDay() % count);
        Tip tip = tips.findAll(PageRequest.of(index, 1, Sort.by("id"))).getContent().get(0);
        return new TipResponse(tip.getId(), tip.getText());
    }
}
