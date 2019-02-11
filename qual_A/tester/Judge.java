import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Scanner;

public class Judge {
    private int execute(TestCase testCase, Scanner outputScanner) {
        int[] permtation = new int[testCase.N];
        Arrays.fill(permtation, -1);

        for (int i = 0; i < testCase.N; i++) {
            String line = outputScanner.nextLine().trim();
            permtation[i] = Integer.parseInt(line);
        }
        while (outputScanner.hasNextLine()) {
            String line = outputScanner.nextLine().trim();
            if (!line.isEmpty()) {
                System.err.println("[ERROR] 末尾に余計な出力があります");
                System.exit(1);
            }
        }

        double variance = testCase.variance(permtation);
        int score = (int) Math.ceil(1e6 / (1 + variance));
        return score;
    }

    public static void main(String[] args) throws Exception {
        if (args.length < 2) {
            System.err.println("usage: java Judge input_file_path output_file_path");
            System.exit(1);
        }
        Path inputFile = Paths.get(args[0]);
        Path outputFile = Paths.get(args[1]);
        try (Scanner inputScanner = new Scanner(inputFile);
            Scanner outputScanner = new Scanner(outputFile)) {
            TestCase testCase = new TestCase(inputScanner);
            int score = new Judge().execute(testCase, outputScanner);
            System.out.println("score:" + score);
        }
    }

}
