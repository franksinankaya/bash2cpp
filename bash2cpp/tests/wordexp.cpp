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


int tokenize(std::string str)
{
	std::vector <std::string> tokens;
	std::string delimiter = "";
	int ret = 0;
	size_t pos = 0; 
	size_t prev = 0; 
	if (str.front() == '\'') prev++;
										
	while ((pos = str.find_first_of(delimiter, prev)) != std::string::npos) {
		if (pos > prev)
			tokens.push_back(str.substr(prev, pos-prev));
		prev = pos+1;
	}
	if (prev < str.length()){
		size_t end = str.length() - prev;
		if (str.back() == '\'') end--;
		tokens.push_back(str.substr(prev, end));
	}

	return ret;
}

int execWrapper(std::string str)
{
    std::vector<char *> toks;
    wordexp_t p;
    char **w;
    int ret;

    ret = wordexp(str.c_str(), &p, 0 );
	if (ret) {
		tokenize(str);
		return ret;
	}
    w = p.we_wordv;
    for (int i = 0; i < p.we_wordc; i++) {
        toks.push_back(w[i]);
    }
    toks.push_back(NULL);

	for (auto &a: toks) {
		std::cout << a << std::endl;
	}
    wordfree(&p);

    return ret;
}

int main(void)
{
	// execWrapper(std::string("ls -la"));
	execWrapper(std::string("ls ' hye -la' rr \"3e3e\" 1&>2"));
	return 0;
}