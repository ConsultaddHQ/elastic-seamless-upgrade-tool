package co.hyperflex.precheck;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;

import co.hyperflex.precheck.core.BaseClusterPrecheck;
import co.hyperflex.precheck.core.BaseElasticNodePrecheck;
import co.hyperflex.precheck.core.BaseIndexPrecheck;
import co.hyperflex.precheck.core.BaseKibanaNodePrecheck;
import co.hyperflex.precheck.core.BaseNodePrecheck;
import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.lang.ArchRule;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

class ArchTest {

  private static final String BASE_PACKAGE = "co.hyperflex.precheck";
  private static JavaClasses importedClasses;

  @BeforeAll
  static void setup() {
    importedClasses = new ClassFileImporter().importPackages(BASE_PACKAGE);
  }

  static Stream<ArchRule> precheckRules() {
    return Stream.of(
        classes().that().areAssignableTo(BaseClusterPrecheck.class)
            .and().areNotAssignableFrom(BaseClusterPrecheck.class)
            .should().resideInAnyPackage(BASE_PACKAGE + ".concrete.cluster"),
        classes().that().areAssignableTo(BaseIndexPrecheck.class)
            .and().areNotAssignableFrom(BaseIndexPrecheck.class)
            .should().resideInAnyPackage(BASE_PACKAGE + ".concrete.index"),
        classes().that().areAssignableTo(BaseElasticNodePrecheck.class)
            .and().areNotAssignableFrom(BaseElasticNodePrecheck.class)
            .should().resideInAnyPackage(BASE_PACKAGE + ".concrete.node.elastic.."),
        classes().that().areAssignableTo(BaseKibanaNodePrecheck.class)
            .and().areNotAssignableFrom(BaseKibanaNodePrecheck.class)
            .should().resideInAnyPackage(BASE_PACKAGE + ".concrete.node.kibana.."),
        classes().that().areAssignableTo(BaseNodePrecheck.class)
            .and().areNotAssignableFrom(BaseNodePrecheck.class)
            .and().areNotAssignableTo(BaseElasticNodePrecheck.class)
            .and().areNotAssignableTo(BaseKibanaNodePrecheck.class)
            .should().resideInAnyPackage(BASE_PACKAGE + ".concrete.node.os..", BASE_PACKAGE + ".concrete.node.common..")
    );
  }

  @ParameterizedTest(name = "{index} => {0}")
  @MethodSource("precheckRules")
  void enforcePrecheckClassLocations(ArchRule rule) {
    rule.check(importedClasses);
  }
}
