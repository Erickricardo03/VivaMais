package com.vivamais.repository;

import com.vivamais.model.Caixa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CaixaRepository extends JpaRepository<Caixa, Long> {

    Optional<Caixa> findByStatus(String status);

    List<Caixa> findByStatusOrderByDataFechamentoDesc(String status);
}
