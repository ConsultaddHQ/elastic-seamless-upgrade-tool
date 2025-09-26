package co.hyperflex.precheck.supportmatrix;


import java.util.List;

public record OsSupport(
    String os,
    String version,
    List<SupportRange> supports
) {
}