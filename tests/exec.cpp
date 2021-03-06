#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <string>
#include <unistd.h>
#include <stdarg.h>
#include <memory>
#include <sys/ioctl.h>
#include <iostream>
#include <regex>
#include <iterator>
#include <glob.h>
#include <pcre.h>
#include <filesystem>
#include <sys/types.h>
#include <sys/wait.h>
#include <fcntl.h>
#include <fstream>
#include <numeric>
#include <string_view>
#include <wordexp.h>
#define PIPE_READ 0
#define PIPE_WRITE 1

int createChild(int *outfd, std::vector<char *> &aArguments, std::string &result, bool stdout, bool resultcollect) {
    int aStdinPipe[2];
    int aStdoutPipe[2];
    int nChild;
    char nChar;
    int nResult;

    if (pipe(aStdinPipe) < 0) {
        return -1;
    }
    if (pipe(aStdoutPipe) < 0) {
        close(aStdinPipe[PIPE_READ]);
        close(aStdinPipe[PIPE_WRITE]);
        return -1;
    }

    nChild = fork();
    if (0 == nChild) {
		close(outfd[0]);
        if (dup2(outfd[1], STDOUT_FILENO) == -1) {
            printf("%s:%d\n", __func__, __LINE__);
            exit(errno);
        }

        if (dup2(outfd[1], STDERR_FILENO) == -1) {
            printf("%s:%d\n", __func__, __LINE__);
            exit(errno);
        }
        close(aStdinPipe[PIPE_READ]);
        close(aStdinPipe[PIPE_WRITE]);
        close(aStdoutPipe[PIPE_READ]);
        close(aStdoutPipe[PIPE_WRITE]);

        nResult = execvpe(aArguments[0], &aArguments[0], environ);

        exit(nResult);
    } else if (nChild > 0) {
		close(outfd[1]);
        close(aStdinPipe[PIPE_READ]);
        close(aStdoutPipe[PIPE_WRITE]);
        close(aStdinPipe[PIPE_WRITE]);
        close(aStdoutPipe[PIPE_READ]);

        int rc;
        if (waitpid(nChild, &rc, 0) != -1) {
            if (WIFEXITED(rc)) {
                nChild = WEXITSTATUS(rc);
            }
        }
    } else {
        close(aStdinPipe[PIPE_READ]);
        close(aStdinPipe[PIPE_WRITE]);
        close(aStdoutPipe[PIPE_READ]);
        close(aStdoutPipe[PIPE_WRITE]);
    }
    return nChild;
}

void execcommand(int *outfd, const std::string_view &cmd, int & exitstatus, std::string &result, bool stdout = true, bool resultcollect = true)
{
    std::vector<char *> toks;
    wordexp_t p;
    char **w;
    int ret;

    ret = wordexp(cmd.data(), &p, 0);
    if (ret) {
        printf("%s:%d\n", __func__, __LINE__);
        exit(-1);
    };
    w = p.we_wordv;
    toks.reserve(p.we_wordc);
    for (int i = 0; i < p.we_wordc; i++) {
        toks.emplace_back(w[i]);
    }
    toks.push_back(NULL);
    exitstatus = createChild(outfd, toks, result, stdout, resultcollect);
    wordfree(&p);
}

const std::string exec(const std::string_view &cmd, bool  collectresults = true) {
    int exitstatus;
    std::string result;
	int outfd[2];
                
    pipe(outfd);
    execcommand(outfd, cmd, exitstatus, result, true, collectresults);

	size_t available = 0;
	const int bufsize = 512;
	char databuf[bufsize + 1];
	databuf[bufsize] = 0;
	char nChar;

	while (read(outfd[0], &nChar, 1) == 1) {
		if (stdout)
			write(STDOUT_FILENO, &nChar, 1);
		if (collectresults) result += nChar;

		ioctl(outfd[0], FIONREAD, &available);
		if (available && collectresults) result.reserve(available + 2);
		while (available / bufsize) {
			read(outfd[0], &databuf[0], bufsize);
			if (stdout)
				write(STDOUT_FILENO, &databuf[0], bufsize);
			if (collectresults) result += databuf;
			available -= bufsize;
		}
		if (available % bufsize) {
			read(outfd[0], &databuf[0], available % bufsize);
			databuf[available % bufsize] = 0;
			if (stdout)
				write(STDOUT_FILENO, &databuf[0], available % bufsize);
			if (collectresults) result += databuf;
		}
	}
	close(outfd[0]);
    return result;
}

const void execnoresult(const std::string_view &cmd) {
    int exitstatus;
    std::string result;
	int outfd[2];
                
    pipe(outfd);
    execcommand(outfd, cmd, exitstatus, result, true, false);
}

const std::string execnoout(const std::string_view &cmd, bool collectresults = true) {
    int exitstatus;
    std::string result;
	int outfd[2];
                
    pipe(outfd);
    execcommand(outfd, cmd, exitstatus, result, false, collectresults);
    return result;
}


int main(int argc, const char *argv[]) {
    exec("cat tests/fstab");
    return 0;
}
