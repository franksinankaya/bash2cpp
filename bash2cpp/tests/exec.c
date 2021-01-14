#include <cstdlib>
#include <array>
#include <iostream>
#include <string>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <errno.h>
#include <sys/ioctl.h>

void execcommand(const std::string &cmd, int& exitstatus, std::string &result, std::string &msg, int direction = 0, bool stdout = true, bool quoteparams=false)
{
	std::string cmd_ = cmd;
	size_t offset = cmd_.find(" ");
	if (offset !=std::string::npos) {
		if (quoteparams)
			cmd_ = cmd_.substr(0, offset) + " \"" + cmd_.substr(offset + 1, std::string::npos) + "\"";
	}
    int in[2];
    int link[2];
    int control[2];
    pid_t pid;

    if (pipe(control)==-1)
        perror("pipe");

    if (pipe(link)==-1)
        perror("pipe");

    if (pipe(in)==-1)
        perror("pipe");

    if ((pid = fork()) == -1)
        perror("fork");

    if(pid == 0) {
        int ret;

        dup2 (in[1], STDIN_FILENO);
        dup2 (link[1], STDOUT_FILENO);
        dup2 (link[1], STDERR_FILENO);
        close(in[1]);
        close(link[1]);
		
        ret = execle(cmd_.c_str(), cmd_.c_str(), NULL);
        // ret = system(cmd_.c_str());
        write(control[1], &ret, sizeof(ret));
        exit(ret);
    }
    else {
		if (msg.size() > 0) {
			write(in[0], msg.data(), msg.size());
		}

        int ret;

        int nbytes = read(control[0], &ret, sizeof(ret));
        if (!ret)
        {
			int bytesAvailable;
			ret = ioctl(link[0], FIONREAD, &bytesAvailable);
			if (ret)
				perror("ioctl");

			std::array <char, 256> buffer; 
		
			for (int i = 0; i < bytesAvailable / buffer.size(); i++)
			{
				auto bytes = read(link[0], buffer.data(), buffer.size());
				result.append(buffer.data(), bytes);
			}
			if (bytesAvailable % buffer.size()) {
				auto bytes = read(link[0], buffer.data(), bytesAvailable % buffer.size());
				result.append(buffer.data(), bytesAvailable % buffer.size());
			}

			if (stdout) 
                std::cout << result;
		}
        exitstatus = ret;
        close(in[0]);
        close(in[1]);
        close(link[0]);
        close(link[1]);
        close(control[0]);
        close(control[1]);
    }
}

int main() {
	std::string result;
	std::string out = "echo hello";
	int exitstatus;
	execcommand("cat", exitstatus, result, out);
    return 0;
}