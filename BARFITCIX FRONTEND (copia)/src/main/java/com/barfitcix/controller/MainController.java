package com.barfitcix.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
public class MainController {

    @GetMapping("/")
    public String login() {
        return "login";
    }

    @GetMapping("/dashboard")
    public String dashboard() {
        return "dashboard";
    }

    @GetMapping("/salas")
    public String salas() {
        return "salas";
    }

    @GetMapping("/mesas/{salaId}")
    public String mesas(@PathVariable String salaId, Model model) {
        model.addAttribute("salaId", salaId);
        return "mesas";
    }

    @GetMapping("/pedido/{mesaId}")
    public String pedido(@PathVariable String mesaId, Model model) {
        model.addAttribute("mesaId", mesaId);
        return "pedido";
    }

    @GetMapping("/historial-pedidos")
    public String historialPedidos() {
        return "historial-pedidos";
    }

    @GetMapping("/resumen-pedido/{pedidoId}")
    public String resumenPedido(@PathVariable String pedidoId, Model model) {
        model.addAttribute("pedidoId", pedidoId);
        return "resumen-pedido";
    }

    @GetMapping("/platos")
    public String platos() {
        return "platos";
    }

    @GetMapping("/reportes")
    public String reportes() {
        return "reportes";
    }

    @GetMapping("/configuracion")
    public String configuracion() {
        return "configuracion";
    }

    @GetMapping("/usuarios")
    public String usuarios() {
        return "usuarios";
    }
}
