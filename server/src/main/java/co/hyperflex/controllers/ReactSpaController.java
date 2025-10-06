package co.hyperflex.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class ReactSpaController {
  @RequestMapping(value = {"/{path:^(?!ws$)[^\\.]*}",
      "/{clusterId}/elastic/**",
      "/{clusterId}/upgrade-assistant",
      "/{clusterId}/cluster-overview",
      "/{clusterId}/kibana/**",
      "/{clusterId}/prechecks/**",
      "/plugins"}
  )
  public String redirect() {
    return "forward:/index.html";
  }
}
