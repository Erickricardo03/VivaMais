package com.vivamais.repository;

import com.vivamais.model.Caixa;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CaixaRepository extends JpaRepository<Caixa, Long> {

    /** @EntityGraph carrega "despesas" já na consulta (fetch join), evitando
     *  LazyInitializationException ao serializar o Caixa: com
     *  spring.jpa.open-in-view=false a sessão do Hibernate fecha assim que o
     *  método de serviço retorna, antes do Jackson converter a resposta. */
    @EntityGraph(attributePaths = {"despesas"})
    Optional<Caixa> findByStatus(String status);

    @EntityGraph(attributePaths = {"despesas"})
    List<Caixa> findByStatusOrderByDataFechamentoDesc(String status);
}
