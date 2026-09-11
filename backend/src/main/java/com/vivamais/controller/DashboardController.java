package com.vivamais.controller;

import com.vivamais.dto.DashboardResumoDTO;
import com.vivamais.dto.FaturamentoPeriodoDTO;
import com.vivamais.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/resumo")
    public ResponseEntity<DashboardResumoDTO> obterResumo() {
        return ResponseEntity.ok(dashboardService.obterResumo());
    }

    @GetMapping("/faturamento")
    public ResponseEntity<FaturamentoPeriodoDTO> obterFaturamento(
            @RequestParam(value = "periodo", required = false, defaultValue = "MENSAL") String periodo,
            @RequestParam(value = "inicio", required = false) String inicio,
            @RequestParam(value = "fim", required = false) String fim) {
        return ResponseEntity.ok(dashboardService.obterFaturamentoFiltrado(periodo, inicio, fim));
    }
}
