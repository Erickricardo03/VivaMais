package com.vivamais.repository;

import com.vivamais.model.Produto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProdutoRepository extends JpaRepository<Produto, Long> {

    List<Produto> findByAtivoTrueOrderByNomeAsc();

    Optional<Produto> findByIdAndAtivoTrue(Long id);

    Optional<Produto> findByCodigoBarrasAndAtivoTrue(String codigoBarras);

    @Query("SELECT p FROM Produto p WHERE p.ativo = true AND " +
           "(LOWER(p.nome) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
           "p.codigoBarras LIKE CONCAT('%', :termo, '%') OR " +
           "LOWER(p.categoria) LIKE LOWER(CONCAT('%', :termo, '%'))) " +
           "ORDER BY p.nome ASC")
    List<Produto> buscarPorTermo(@Param("termo") String termo);

    @Query("SELECT p FROM Produto p WHERE p.ativo = true AND p.estoqueAtual <= p.estoqueMinimo ORDER BY (p.estoqueAtual - p.estoqueMinimo) ASC")
    List<Produto> findProdutosComEstoqueBaixo();

    @Query("SELECT p FROM Produto p WHERE p.ativo = true AND p.dataValidade IS NOT NULL AND p.dataValidade <= :dataLimite ORDER BY p.dataValidade ASC")
    List<Produto> findProdutosVencendoAte(@Param("dataLimite") LocalDate dataLimite);

    @Query("SELECT p FROM Produto p WHERE p.ativo = true AND p.dataValidade IS NOT NULL AND p.dataValidade < :hoje ORDER BY p.dataValidade ASC")
    List<Produto> findProdutosVencidos(@Param("hoje") LocalDate hoje);

    @Query("SELECT DISTINCT p.categoria FROM Produto p WHERE p.ativo = true ORDER BY p.categoria ASC")
    List<String> findCategoriasDistintas();

    List<Produto> findByCategoriaAndAtivoTrueOrderByNomeAsc(String categoria);

    long countByAtivoTrue();

    @Query("SELECT COUNT(p) FROM Produto p WHERE p.ativo = true AND p.estoqueAtual <= p.estoqueMinimo")
    long countProdutosComEstoqueBaixo();

    @Query("SELECT COUNT(p) FROM Produto p WHERE p.ativo = true AND p.dataValidade IS NOT NULL AND p.dataValidade < :hoje")
    long countProdutosVencidos(@Param("hoje") LocalDate hoje);

    @Query("SELECT COUNT(p) FROM Produto p WHERE p.ativo = true AND p.dataValidade IS NOT NULL AND p.dataValidade >= :hoje AND p.dataValidade <= :dataLimite")
    long countProdutosVencendoEmBreve(@Param("hoje") LocalDate hoje, @Param("dataLimite") LocalDate dataLimite);
}
