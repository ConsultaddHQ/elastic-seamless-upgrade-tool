package co.hyperflex.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class ReactSpaController {
  @RequestMapping(value = {"/{path:^(?!ws$)[^\\.]*}", "/elastic/**", "/kibana/**", "/plugins"})
  public String redirect() {
    return "forward:/index.html";
  }
}
