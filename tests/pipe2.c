#include <array>
#include <vector>
#include <sstream>
#include <iostream>
#include <fstream>
#include <cstdlib>
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <unistd.h>
#include <errno.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <stdlib.h>
#include <stdio.h>
#include <fcntl.h>
#include <wordexp.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>
#include <sys/ioctl.h>

#define PIPE_READ 0
#define PIPE_WRITE 1

extern char** environ;

int createChild(std::vector<char *> &aArguments) {
    int aStdinPipe[2];
    int aStdoutPipe[2];
    int nChild;
    char nChar;
    int nResult;

    if (pipe(aStdinPipe) < 0) {
        perror("allocating pipe for child input redirect");
        return -1;
    }
    if (pipe(aStdoutPipe) < 0) {
        close(aStdinPipe[PIPE_READ]);
        close(aStdinPipe[PIPE_WRITE]);
        perror("allocating pipe for child output redirect");
        return -1;
    }

    nChild = fork();
    if (0 == nChild) {
        if (dup2(aStdoutPipe[PIPE_WRITE], STDOUT_FILENO) == -1) {
            exit(errno);
        }

        if (dup2(aStdoutPipe[PIPE_WRITE], STDERR_FILENO) == -1) {
            exit(errno);
        }

        close(aStdinPipe[PIPE_READ]);
        close(aStdinPipe[PIPE_WRITE]);
        close(aStdoutPipe[PIPE_READ]);
        close(aStdoutPipe[PIPE_WRITE]);

        nResult = execvpe(aArguments[0], &aArguments[0], environ);

        exit(nResult);
    } else if (nChild > 0) {
        close(aStdinPipe[PIPE_READ]);
        close(aStdoutPipe[PIPE_WRITE]);

        while (read(aStdoutPipe[PIPE_READ], &nChar, 1) == 1) {
            std::cout << nChar;
        }

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

int execWrapper(std::string str)
{
    std::vector<char *> toks;
    wordexp_t p;
    char **w;
    int ret;

    wordexp(str.c_str(), &p, 0);
    w = p.we_wordv;
    for (int i = 0; i < p.we_wordc; i++) {
        toks.push_back(w[i]);
    }
    toks.push_back(NULL);

    ret = createChild(toks);
    wordfree(&p);
    return ret;
}

void testCall()
{
    std::streambuf *backupout0 = std::cout.rdbuf();
    std::streambuf *backupin0 = std::cin.rdbuf();
    std::stringstream   redirectStream0;
    std::cout.rdbuf(redirectStream0.rdbuf());
    // execWrapper("df /dev/sda");
    execWrapper("echo hello");
    std::cout.rdbuf(backupout0);
    std::cout << redirectStream0.str();

    std::cin.rdbuf(backupin0);


    std::streambuf *backupout1 = std::cout.rdbuf();
    std::streambuf *backupin1 = std::cin.rdbuf();
    std::stringstream   redirectStream1;
    std::cout.rdbuf(redirectStream1.rdbuf());
    std::cin.rdbuf(redirectStream0.rdbuf());
    // execWrapper("awk '/^\//{print $3}'");
    execWrapper("wc");
    // exec(get_env("AWK") + " " + "'/^\\//{print $3}'",true, false);
    std::cout.rdbuf(backupout1);

    std::cin.rdbuf(backupin1);
    // return redirectStream1
    std::cout << redirectStream1.str();
}

class scopeexitcinfile {
    int m_backup;
    int m_redirectStream;
public:
    scopeexitcinfile(const std::string &file) {
        m_redirectStream = open(file.c_str(), O_RDONLY);
        m_backup = dup(0);
        if (m_redirectStream >= 0) {
            dup2(m_redirectStream, STDIN_FILENO);
            close(m_redirectStream);
        }
    }
    ~scopeexitcinfile() {
        dup2(m_backup, 0);
        close(m_backup);
    }
};

class scopeexitcincout {
            
	std::streambuf *backupout = std::cout.rdbuf();
	std::streambuf *backupin = std::cin.rdbuf();
	std::stringstream buffer;
	int readfd[2];
	int m_inbackup;
	bool m_released = false;

	public: 

	~scopeexitcincout() {
		release();
	}
	scopeexitcincout() {
		std::cout.rdbuf(buffer.rdbuf());
		pipe(readfd);
		m_inbackup = dup(0);
		dup2(readfd[0], STDIN_FILENO); 
		close(readfd[0]);
	}

	std::string buf() { return buffer.str();}

	void release() {
		if (m_released) return;

		std::cout.rdbuf(backupout);
		std::cin.rdbuf(backupin);
		dup2(m_inbackup, 0); 
		close(m_inbackup); 
		m_released = true;
	}

	void writecin(std::string &str) {
		write(readfd[1], str.data(), str.size());
		close(readfd[1]);
	}
};

class scopeexitcoutfile {
    std::streambuf *m_backup;
    std::ofstream m_redirectStream;
public:
    scopeexitcoutfile(const std::string &file, bool append = false) {
        append ? m_redirectStream = std::ofstream(file, std::ios_base::app): m_redirectStream = std::ofstream(file);
        m_backup = std::cout.rdbuf();
        if (m_redirectStream) std::cout.rdbuf(m_redirectStream.rdbuf());
    }
    ~scopeexitcoutfile() {
        std::cout.rdbuf(m_backup);
    }
};

class scopeexitcerrfile {
    std::streambuf *m_backup;
    std::ofstream m_redirectStream;
public:
    scopeexitcerrfile(const std::string &file, bool append = false) {
        append ? m_redirectStream = std::ofstream(file, std::ios_base::app): m_redirectStream = std::ofstream(file);
        m_backup = std::cerr.rdbuf();
        if (m_redirectStream) std::cerr.rdbuf(m_redirectStream.rdbuf());
    }
    ~scopeexitcerrfile() {
        std::cerr.rdbuf(m_backup);
    }
};

int main()
{
	std::string text;
    {
        scopeexitcincout scope;
		std::string str("hello");
		scope.writecin(str);
        execWrapper("wc");
		text = scope.buf();
    }
	std::cout << text << std::endl;
	exit(0);
   execWrapper("echo hello");
    // testCall();
    {
        scopeexitcoutfile scopeout("out.txt");
        scopeexitcinfile scope("in.txt");
        execWrapper("wc");
    }
 
    return 0;
}