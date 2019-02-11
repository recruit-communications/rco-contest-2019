import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Scanner;

public class Judge {

    private static final int[] DR = {1, 0, -1, 0};
    private static final int[] DC = {0, 1, 0, -1};
    private static final int REMOVED = Integer.MIN_VALUE;

    static class Position {
        int r, c;

        Position(int r, int c) {
            this.r = r;
            this.c = c;
        }

        @Override
        public boolean equals(Object o) {
            if (!(o instanceof Position)) return false;
            Position another = (Position) o;
            return r == another.r && c == another.c;
        }
    }

    static class Output {
        ArrayList<Integer> r = new ArrayList<>();
        ArrayList<Integer> c = new ArrayList<>();
        ArrayList<Boolean> isRm = new ArrayList<>();
        int[][] a;

        Output(Scanner sc, TestCase testcase) {
            int lineno = 0;
            while (sc.hasNextLine()) {
                lineno++;
                String line = sc.nextLine();
                String[] elems = line.trim().split("\\s+");
                boolean isEmptyLine = elems.length == 0 || (elems.length == 1 && elems[0].isEmpty());
                if (isEmptyLine && r.size() == testcase.M) continue;
                if (elems.length != 3) {
                    throw new RuntimeException("line " + lineno + ": 不正な出力です " + line);
                }
                if (elems[0].equals("1")) {
                    isRm.add(false);
                } else if (elems[0].equals("2")) {
                    isRm.add(true);
                } else {
                    throw new RuntimeException("line " + lineno + ": 不正な出力です " + line);
                }
                int rv = Integer.parseInt(elems[1]);
                int cv = Integer.parseInt(elems[2]);
                r.add(rv);
                c.add(cv);
                if (r.size() > testcase.M) {
                    throw new RuntimeException(testcase.M + "回より多い操作を行おうとしました");
                }
            }
            a = new int[testcase.N][];
            for (int i = 0; i < testcase.N; i++) {
                a[i] = testcase.A[i].clone();
            }
        }

        void increment(TestCase testcase, int cr, int cc) {
            a[cr][cc]++;
        }

        int remove(TestCase testcase, int cr, int cc) {
            ArrayList<Position> list = new ArrayList<>();
            list.add(new Position(cr, cc));
            for (int i = 0; i < list.size(); i++) {
                for (int j = 0; j < 4; j++) {
                    int nr = list.get(i).r + DR[j];
                    int nc = list.get(i).c + DC[j];
                    Position np = new Position(nr, nc);
                    if (0 <= nr && nr < testcase.N && 0 <= nc && nc < testcase.N
                            && a[nr][nc] == a[cr][cc] && !list.contains(np)) {
                        list.add(np);
                    }
                }
            }
            if (list.size() >= a[cr][cc]) {
                int ret = list.size() * a[cr][cc];
                for (Position p : list) {
                    a[p.r][p.c] = REMOVED;
                }
                return ret;
            } else {
                return 0;
            }
        }
    }

    static int calcScore(TestCase testcase, Output output) {
        int score = 0;
        for (int i = 0; i < output.r.size(); i++) {
            int cr = output.r.get(i);
            int cc = output.c.get(i);
            if (cr < 0 || testcase.N <= cr || cc < 0 || testcase.N <= cc) {
                throw new RuntimeException("line " + (i + 1) + ": 座標が範囲外です (" + cr + "," + cc + ")");
            }
            if (output.a[cr][cc] == REMOVED) {
                System.err.println("[warning] line " + (i + 1) + ": すでに収穫済みの区画を操作しようとしました。無視します (" + cr + "," + cc + ")");
            } else if (output.isRm.get(i)) {
                int scoreDiff = output.remove(testcase, cr, cc);
                if (scoreDiff == 0) {
                    System.err.println("[warning] line " + (i + 1) + ": 収穫しようとした区画が条件を満たしていません。無視します (" + cr + "," + cc + ")");
                }
                score += scoreDiff;
            } else {
                output.increment(testcase, cr, cc);
            }
        }
        return score;
    }

    public static void main(String[] args) throws Exception {
        if (args.length < 2) {
            System.err.println("usage: java Judge input_file_path output_file_path");
            System.exit(1);
        }
        Path inputFile = Paths.get(args[0]);
        Path outputFile = Paths.get(args[1]);
        TestCase testcase = new TestCase(new Scanner(inputFile));
        Output output = new Output(new Scanner(outputFile), testcase);
        int score = calcScore(testcase, output);
        System.out.println("score:" + score);
    }

}
