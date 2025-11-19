package co.hyperflex.controllers;

import co.hyperflex.ai.AskRequest;
import co.hyperflex.ai.Assistant;
import co.hyperflex.ai.SessionContextHolder;
import co.hyperflex.breakingchanges.BreakingChangeRepository;
import java.util.HashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai-assistant")
public class AiAssistantController {
  private final Assistant assistant;
  private final BreakingChangeRepository breakingChangeRepository;
  private final Map<Integer, String> contextMap = new HashMap<>();

  public AiAssistantController(Assistant assistant, BreakingChangeRepository breakingChangeRepository) {
    this.assistant = assistant;
    this.breakingChangeRepository = breakingChangeRepository;
  }

  @PostMapping("/ask")
  public String ask(@RequestBody AskRequest request) {
    try {
      SessionContextHolder.setSessionContext(request.context());
      var message = request.message().asText();
      if (request.context() != null && request.context().precheckId() != null) {
        var precheckId = request.context().precheckId();
        if (!contextMap.containsKey(1) || !precheckId.equals(contextMap.get(1))) {
          var change = breakingChangeRepository.findById(precheckId).orElseThrow();
          contextMap.put(1, change.getId());
          message = """
              # Breaking Change Context
              - **Title:** %s
              - **Description:** %s
              - **Impact:** %s
              - **Source:** %s
              
              # User Query
              %s
              """.formatted(change.getTitle(), change.getDetail(), change.getImpact(), change.getUrl(), message);

        }
      }
      return assistant.chat(1, message);
    } finally {
      SessionContextHolder.removeSessionContext();
    }
  }
}
