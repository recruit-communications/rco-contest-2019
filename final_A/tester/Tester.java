import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.util.Random;
import java.util.Scanner;
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.ForkJoinTask;
import java.util.concurrent.TimeUnit;

public class Tester {

    private static final int N = 50;
    private static final int T = 10000;

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

    static class State {
        static final int UNKNOWN = -1;
        XorShift[] rnds = new XorShift[N];
        int[] cards = new int[N];
        int pos;
        int totalDist;
        int score;

        State(long seed) {
            XorShift rndSeed = new XorShift();
            rndSeed.setSeed(seed);
            for (int i = 0; i < N; i++) {
                rnds[i] = new XorShift();
                rnds[i].setSeed(rndSeed.next());
                cards[i] = UNKNOWN;
                for (int j = 0; j < T; j++) {
                    rndSeed.next();
                }
            }
        }

        int moveAndRead(int newPos) {
            if (cards[newPos] == UNKNOWN) {
                cards[newPos] = rnds[newPos].nextInt(N / 2) + 1;
            }
            int dist = Math.abs(newPos - pos);
            totalDist += dist;
            int card = cards[newPos];
            if (newPos != pos && cards[pos] == card) {
                score += card;
                cards[pos] = cards[newPos] = UNKNOWN;
            }
            pos = newPos;
            return card;
        }
    }

    private int execute(long seed) throws Exception {
        State state = new State(seed);
        ProcessBuilder pb = new ProcessBuilder(command.split("\\s+"));
        Process proc = pb.start();
        OutputStream os = proc.getOutputStream();
        ForkJoinTask<?> readError = ForkJoinPool.commonPool().submit(() -> {
            // redirect command stderr
            try (InputStreamReader reader = new InputStreamReader(proc.getErrorStream())) {
                while (true) {
                    int ch = reader.read();
                    if (ch == -1) break;
                    System.err.print((char) ch);
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        });
        try (Scanner sc = new Scanner(proc.getInputStream())) {
            os.write((N + " " + T + "\n").getBytes());
            os.flush();
            while (true) {
                String line = sc.nextLine();
                String[] elements = line.trim().split("\\s+");
                if (elements.length == 0 || elements.length > 1) {
                    throw new RuntimeException("不正な出力です: " + line);
                }
                int newPos;
                try {
                    newPos = Integer.parseInt(elements[0]);
                } catch (NumberFormatException e) {
                    throw new RuntimeException("不正な出力です: " + line);
                }
                if (newPos == -1) {
                    break;
                }
                if (newPos < 0 || N <= newPos) {
                    throw new RuntimeException("不正な位置を指定しました: " + newPos);
                }
                int card = state.moveAndRead(newPos);
                os.write((card + "\n").getBytes());
                os.flush();
                if (state.totalDist > T) {
                    throw new RuntimeException("距離 " + T + " を超えて行動しようとしました");
                }
                if (debug) {
                    System.err.printf("total distance:%4d score:%4d position:%2d card:%2d\n",
                            state.totalDist, state.score, state.pos, card);
                    StringBuilder row = new StringBuilder(" ");
                    for (int i = 0; i < N; i++) {
                        int c = state.cards[i];
                        String num = c == State.UNKNOWN ? "??" : String.format("%2d", c);
                        row.append(num).append(" ");
                    }
                    row.replace(state.pos * 3, state.pos * 3 + 1, "[");
                    row.replace(state.pos * 3 + 3, state.pos * 3 + 4, "]");
                    System.err.println(row);
                    System.err.println();
                }
            }
            readError.get(10, TimeUnit.SECONDS); // wait termination
            return state.score;
        } finally {
            proc.destroy();
        }
    }

    private static String command;
    private static boolean debug;

    static void usage() {
        System.err.println("usage: java Tester -command \"command\" [-seed seed] [-debug]");
        System.exit(1);
    }

    public static void main(String[] args) throws Exception {
        long seed = new Random().nextInt();
        for (int i = 0; i < args.length; ++i) {
            if (args[i].equals("-seed")) {
                seed = Long.parseLong(args[++i]);
            } else if (args[i].equals("-command")) {
                command = args[++i];
            } else if (args[i].equals("-debug")) {
                debug = true;
            } else {
                System.err.println("unknown option:" + args[i]);
                usage();
            }
        }
        if (command == null) {
            usage();
        }
        Tester tester = new Tester();
        int score = tester.execute(seed);
        System.out.println("score:" + score);
    }

}
