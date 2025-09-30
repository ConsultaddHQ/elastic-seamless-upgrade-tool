package co.hyperflex.ai.config;

import dev.langchain4j.model.bedrock.BedrockChatModel;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.chat.request.ChatRequestParameters;
import dev.langchain4j.model.chat.request.ResponseFormat;
import dev.langchain4j.model.ollama.OllamaChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ChatModelConfig {
  private static String MODEL_NAME = "us.anthropic.claude-3-5-sonnet-20241022-v2:0";

  @Bean
  public ChatModel chatModel(@Value("${llm.useOllama:false}") boolean useOllama) {
    if (useOllama) {
      return OllamaChatModel.builder()
          .baseUrl("http://localhost:11434")
          .modelName("llama3.1:8b")
          .logRequests(true)
          .responseFormat(ResponseFormat.TEXT)
          .build();
    }

    return BedrockChatModel.builder()
        .modelId(MODEL_NAME)
        .maxRetries(5)
        .defaultRequestParameters(ChatRequestParameters.builder().temperature(0.5).build())
        .logRequests(true)
        .logResponses(true)
        .build();
  }
}
