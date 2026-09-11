package com.vivamais.repository;

import com.vivamais.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    List<Cliente> findAllByOrderByNomeAsc();

    @Query("SELECT c FROM Cliente c WHERE " +
           "LOWER(c.nome) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
           "c.telefone LIKE CONCAT('%', :termo, '%') OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', :termo, '%')) " +
           "ORDER BY c.nome ASC")
    List<Cliente> buscarPorTermo(@Param("termo") String termo);
}
