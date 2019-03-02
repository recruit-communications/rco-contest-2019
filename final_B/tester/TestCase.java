import java.util.ArrayList;
import java.util.Scanner;

public class TestCase {

    private static final int N_FIXED = 20;
    private static final int M_FIXED = 1000;
    private static final int MIX = 1000;

    int N, M;
    int[][] C;
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

    TestCase(long seed) throws Exception {
        rnd = new XorShift();
        rnd.setSeed(seed);
        this.N = N_FIXED;
        this.M = M_FIXED;
        this.C = new int[N][N];
        for (int i = 0; i < N; i++) {
            for (int j = 0; j < N; j++) {
                this.C[i][j] = color(i, j);
            }
        }
        ArrayList<SubSquare> squares = new ArrayList<>();
        for (int i = 0; i < N; i++) {
            for (int j = 0; j < N; j++) {
                for (int k = 2; i + k <= N && j + k <= N; k++) {
                    squares.add(new SubSquare(i, j, k));
                }
            }
        }
        for (int i = 0; i < MIX; i++) {
            SubSquare sq = squares.get(rnd.nextInt(squares.size()));
            rotateCounterClockwise(sq);
        }
    }

    TestCase(Scanner sc) {
        this.N = sc.nextInt();
        this.M = sc.nextInt();
        this.C = new int[N][N];
        for (int i = 0; i < N; i++) {
            for (int j = 0; j < N; j++) {
                this.C[i][j] = sc.nextInt();
            }
        }
    }

    @Override
    public String toString() {
        StringBuilder builder = new StringBuilder();
        builder.append(this.N + " " + this.M + "\n");
        for (int i = 0; i < N; i++) {
            for (int j = 0; j < N; j++) {
                builder.append(this.C[i][j] + (j == N - 1 ? "\n" : " "));
            }
        }
        return builder.toString();
    }

    int color(int r, int c) {
        int hi = r < N / 2 ? 0 : 2;
        int lo = c < N / 2 ? 0 : 1;
        return hi | lo;
    }

    void rotateClockwise(SubSquare square) {
        for (int i = 0; i < square.size / 2; i++) {
            for (int j = 0; j < (square.size + 1) / 2; j++) {
                int first = C[square.r + i][square.c + j];
                C[square.r + i][square.c + j] = C[square.r + square.size - 1 - j][square.c + i];
                C[square.r + square.size - 1 - j][square.c + i] = C[square.r + square.size - 1 - i][square.c + square.size - 1 - j];
                C[square.r + square.size - 1 - i][square.c + square.size - 1 - j] = C[square.r + j][square.c + square.size - 1 - i];
                C[square.r + j][square.c + square.size - 1 - i] = first;
            }
        }
    }

    void rotateCounterClockwise(SubSquare square) {
        for (int i = 0; i < square.size / 2; i++) {
            for (int j = 0; j < (square.size + 1) / 2; j++) {
                int first = C[square.r + i][square.c + j];
                C[square.r + i][square.c + j] = C[square.r + j][square.c + square.size - 1 - i];
                C[square.r + j][square.c + square.size - 1 - i] = C[square.r + square.size - 1 - i][square.c + square.size - 1 - j];
                C[square.r + square.size - 1 - i][square.c + square.size - 1 - j] = C[square.r + square.size - 1 - j][square.c + i];
                C[square.r + square.size - 1 - j][square.c + i] = first;
            }
        }
    }

    static class SubSquare {
        int r, c, size;

        SubSquare(int r, int c, int size) {
            this.r = r;
            this.c = c;
            this.size = size;
        }
    }
}
