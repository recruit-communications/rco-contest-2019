import java.util.ArrayList;
import java.util.Scanner;

public class TestCase {

    private static final int N_FIXED = 50;
    private static final int M_FIXED = 2500;
    private static final int MIN_A = 1;
    private static final int MAX_A = 9;

    int N, M;
    int[][] A;
    XorShift rnd;

    static class XorShift {
        long x = 88172645463325252L;

        void setSeed(long seed) {
            x = seed;
        }

        long next() {
            x ^= x << 13;
            x ^= x >>> 7;
            x ^= x << 17;
            return x;
        }

        int nextInt(int n) {
            long upper = Long.divideUnsigned(-1, n) * n;
            long v = next();
            while (Long.compareUnsigned(v, upper) >= 0) {
                v = next();
            }
            return (int) Long.remainderUnsigned(v, n);
        }
    }

    TestCase(long seed) {
        rnd = new XorShift();
        rnd.setSeed(seed);
        this.N = N_FIXED;
        this.M = M_FIXED;
        this.A = new int[N][N];
        for (int i = 0; i < N; i++) {
            for (int j = 0; j < N; j++) {
                this.A[i][j] = rnd.nextInt(MAX_A - MIN_A + 1) + MIN_A;
            }
        }
    }

    TestCase(Scanner sc) {
        this.N = sc.nextInt();
        this.M = sc.nextInt();
        this.A = new int[N][N];
        for (int i = 0; i < N; i++) {
            for (int j = 0; j < N; j++) {
                this.A[i][j] = sc.nextInt();
            }
        }
    }

    @Override
    public String toString() {
        StringBuilder builder = new StringBuilder();
        builder.append(this.N + " " + this.M + "\n");
        for (int i = 0; i < N; i++) {
            for (int j = 0; j < N; j++) {
                builder.append(this.A[i][j] + (j == N - 1 ? "\n" : " "));
            }
        }
        return builder.toString();
    }
}
