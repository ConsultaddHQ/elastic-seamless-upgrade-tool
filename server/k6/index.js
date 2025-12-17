import http from 'k6/http';
import {check} from 'k6';
import {Counter, Rate, Trend} from 'k6/metrics';

// ---------- Custom metrics ----------
const qps = new Counter('qps');             // simple counter for total requests (useful for QPS calculations)
const errors = new Rate('errors');          // fraction of failed checks
const latency = new Trend('latency_ms');    // detailed latency trend in ms
const respBytes = new Trend('response_bytes');

// ---------- Config via environment vars ----------
const TARGET = __ENV.TARGET_URL || 'https://localhost:8080/api/v1/clusters/68d14cc6e5220dedf785d69c/prechecks'; // target GET endpoint
const RPS = __ENV.RPS ? parseInt(__ENV.RPS) : 200;
const DURATION = __ENV.DURATION || '1m';

// ---------- k6 options ----------
export let options = {
    insecureSkipTLSVerify: true,
    scenarios: {
        constant_rate: {
            executor: 'constant-arrival-rate',
            rate: RPS,
            timeUnit: '1s',
            duration: DURATION,
            preAllocatedVUs: 60,
            maxVUs: 500,
        },
    },

    // thresholds let you fail the run if conditions are not met
    thresholds: {
        'http_req_duration': ['p(95)<500', 'p(99)<1500'],
        'errors': ['rate<0.01']
    },
};

// ---------- The VU function ----------
export default function () {
    const res = http.get(TARGET);
    qps.add(1);
    latency.add(res.timings.duration);         // timings.duration is total req time in ms
    respBytes.add(res.body ? res.body.length : 0);

    const ok = check(res, {
        'status is 200': (r) => r.status === 200,
        'response not empty': (r) => r.body && r.body.length > 0,
    });

    if (!ok) {
        errors.add(1);
    } else {
        errors.add(0);
    }
}
