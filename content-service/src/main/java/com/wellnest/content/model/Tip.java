package com.wellnest.content.model;

import jakarta.persistence.*;

@Entity
@Table(name = "tip")
public class Tip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String text;

    public Tip() {}
    public Tip(String text) { this.text = text; }

    public Long getId() { return id; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
}
