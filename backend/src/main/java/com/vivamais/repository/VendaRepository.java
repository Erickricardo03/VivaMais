package com.vivamais.repository;

import com.vivamais.model.Venda;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface VendaRepository extends JpaRepository<Venda, Long> {

    @EntityGraph(attributePaths = {"itens", "itens.produto", "cliente"})
    List<Venda> findByDataHoraBetweenAndStatusOrderByDataHoraDesc(LocalDateTime inicio, LocalDateTime fim, String status);

    @EntityGraph(attributePaths = {"itens", "itens.produto", "cliente"})
    List<Venda> findTop20ByOrderByDataHoraDesc();

    @Override
    @EntityGraph(attributePaths = {"itens", "itens.produto", "cliente"})
    List<Venda> findAll();

    Optional<Venda> findByNumeroVenda(String numeroVenda);

    @Query("SELECT COALESCE(SUM(v.valorTotal), 0) FROM Venda v WHERE v.status = 'CONCLUIDA' AND v.dataHora BETWEEN :inicio AND :fim")
    BigDecimal sumFaturamentoBetween(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim);

    @Query("SELECT COUNT(v) FROM Venda v WHERE v.status = 'CONCLUIDA' AND v.dataHora BETWEEN :inicio AND :fim")
    long countVendasBetween(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim);

    @Query("SELECT iv.nomeProduto, SUM(iv.quantidade), SUM(iv.subtotal) " +
           "FROM ItemVenda iv " +
           "WHERE iv.venda.status = 'CONCLUIDA' AND iv.venda.dataHora BETWEEN :inicio AND :fim " +
           "GROUP BY iv.nomeProduto " +
           "ORDER BY SUM(iv.quantidade) DESC")
    List<Object[]> findTopProdutosVendidos(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim);
}
