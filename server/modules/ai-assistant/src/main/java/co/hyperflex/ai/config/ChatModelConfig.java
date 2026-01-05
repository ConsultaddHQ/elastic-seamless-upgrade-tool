package co.hyperflex.ai.config;

import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.chat.request.ResponseFormat;
import dev.langchain4j.model.ollama.OllamaChatModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ChatModelConfig {

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

    return OpenAiChatModel.builder()
        .baseUrl("https://api.groq.com/openai/v1")
        .apiKey("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")
        .modelName("llama-3.3-70b-versatile")
        .build();
  }
}
