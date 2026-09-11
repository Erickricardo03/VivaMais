package com.vivamais.repository;

import com.vivamais.model.MovimentacaoEstoque;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MovimentacaoEstoqueRepository extends JpaRepository<MovimentacaoEstoque, Long> {
    List<MovimentacaoEstoque> findByProdutoIdOrderByDataHoraDesc(Long produtoId);
    List<MovimentacaoEstoque> findTop50ByOrderByDataHoraDesc();
    List<MovimentacaoEstoque> findByDataHoraBetweenOrderByDataHoraDesc(LocalDateTime inicio, LocalDateTime fim);
}
