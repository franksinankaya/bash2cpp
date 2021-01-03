#include <string>
#include <iostream>
#include <filesystem>
#include <glob.h>
#include <vector>
#include <string>

std::vector<std::string> globVector(const std::string& pattern){
    glob_t glob_result;
    glob(pattern.c_str(),GLOB_TILDE,NULL,&glob_result);
    std::vector<std::string> files;
    for(unsigned int i=0;i<glob_result.gl_pathc;++i){
        files.push_back(std::string(glob_result.gl_pathv[i]));
    }
    globfree(&glob_result);
    return files;
}

int main()
{
    std::string path = "tests";
    //for (const auto & entry : std::filesystem::directory_iterator(path))
    //    std::cout << entry.path() << std::endl;

    std::vector<std::string> files = globVector("tests/*.sh");
    for (const auto & entry : files)
	std::cout << entry << std::endl;
}