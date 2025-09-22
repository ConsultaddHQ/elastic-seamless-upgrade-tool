package co.hyperflex.ai.config;

import dev.langchain4j.model.bedrock.BedrockChatModel;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.chat.request.ChatRequestParameters;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ChatModelConfig {
  private static String MODEL_NAME = "us.anthropic.claude-3-5-sonnet-20241022-v2:0";

  //  @Bean
  //  public ChatModel chatModel() {
  //    return OllamaChatModel.builder()
  //        .baseUrl("http://localhost:11434")
  //        .modelName("llama3.1:8b")
  //        .logRequests(true)
  //        .responseFormat(ResponseFormat.TEXT)
  //        .build();
  //
  //  }


  @Bean
  public ChatModel chatModel() {
    return BedrockChatModel.builder()
        .modelId(MODEL_NAME)
        .maxRetries(3)
        .defaultRequestParameters(ChatRequestParameters.builder().temperature(0.2).build())
        .logRequests(true)
        .logResponses(true)
        .build();

  }
}
