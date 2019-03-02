import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Scanner;

public class Judge {

    static class Output {
        ArrayList<TestCase.SubSquare> squares = new ArrayList<>();

        Output(Scanner sc, TestCase testcase) {
            int lineno = 0;
            while (sc.hasNextLine() && squares.size() < testcase.M) {
                lineno++;
                String line = sc.nextLine();
                String line_trimmed = line.trim();
                if (line_trimmed.isEmpty()) break;
                String[] elems = line_trimmed.split("\\s+");
                if (elems.length != 3) {
                    throw new RuntimeException("line " + lineno + " 不正な出力です:" + line);
                }
                int rv = Integer.parseInt(elems[0]);
                int cv = Integer.parseInt(elems[1]);
                int sv = Integer.parseInt(elems[2]);
                if (sv < 1 || rv < 0 || testcase.N < rv + sv || cv < 0 || testcase.N < cv + sv) {
                    throw new RuntimeException("line " + lineno + " 不正な出力です:" + line);
                }
                squares.add(new TestCase.SubSquare(rv, cv, sv));
            }
            while (sc.hasNextLine()) {
                lineno++;
                String line = sc.nextLine();
                String line_trimmed = line.trim();
                if (line_trimmed.isEmpty()) continue;
                if (squares.size() < testcase.M) {
                    throw new RuntimeException("line " + lineno + " 空行の後に出力があります");
                } else {
                    throw new RuntimeException(testcase.M + "回より多い操作を行おうとしました");
                }
            }
        }

    }

    static int calcScore(TestCase testcase, Output output) {
        for (int i = 0; i < output.squares.size(); i++) {
            TestCase.SubSquare sq = output.squares.get(i);
            int cr = sq.r;
            int cc = sq.c;
            int cs = sq.size;
            testcase.rotateClockwise(sq);
        }
        int score = 0;
        for (int i = 0; i < testcase.N; i++) {
            for (int j = 0; j < testcase.N; j++) {
                if (testcase.C[i][j] == testcase.color(i, j)) ++score;
            }
        }
        if (score == testcase.N * testcase.N) {
            score += testcase.M - output.squares.size();
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
