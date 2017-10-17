// Generated by CoffeeScript 1.12.7

/*
  git-ipfs.coffee
  Created by Zefram Lou (Zebang Liu) as part of the WikiGit project.

  This file implements a daemon that listens for the TaskSolutionAccepted() event
  from the GitHandler module. Upon such an event, the daemon would clone the
  DASP's Git repo, pull from the updated repo where the task has been completed
  to merge the solution into the DASP's repo, publish the resulting repo onto IPFS,
  and send its IPFS multihash back to GitHandler as the current location of the DASP's repo.
 */

(function() {
  var Web3, fs, git, gitHandlerAbi, gitHandlerAddr, gitHandlerContract, hexToStr, ipfs, ipfsAPI, keccak256, mainAbi, mainAddr, mainContract, tasksHandlerAbi, tasksHandlerAddr, tasksHandlerContract, web3;

  Web3 = require('web3');

  web3 = new Web3();

  web3.setProvider(new Web3.providers.HttpProvider("http://localhost:8545"));

  ipfsAPI = require('ipfs-api');

  ipfs = ipfsAPI('localhost', '5001', {
    protocol: 'http'
  });

  git = require('gift');

  fs = require('fs');

  keccak256 = require('js-sha3').keccak256;

  hexToStr = (function(_this) {
    return function(hex) {
      var i, j, ref, str;
      hex = hex.substr(2);
      str = '';
      for (i = j = 0, ref = hex.length - 1; j <= ref; i = j += 2) {
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
      }
      return str;
    };
  })(this);

  mainAddr = "0xd23d23eee823081dd9221335ddd15b4f61974029";

  mainAbi = require('./abi/mainABI.json');

  mainContract = new web3.eth.Contract(mainAbi, mainAddr);

  tasksHandlerAddr = tasksHandlerAbi = tasksHandlerContract = null;

  gitHandlerAddr = gitHandlerAbi = gitHandlerContract = null;

  mainContract.methods.moduleAddresses('0x' + keccak256('TASKS')).call().then((function(_this) {
    return function(result) {
      tasksHandlerAddr = result;
      tasksHandlerAbi = require('./abi/tasksHandlerABI.json');
      return tasksHandlerContract = new web3.eth.Contract(tasksHandlerAbi, tasksHandlerAddr);
    };
  })(this)).then((function(_this) {
    return function() {
      return mainContract.methods.moduleAddresses('0x' + keccak256('GIT')).call().then(function(result) {
        gitHandlerAddr = result;
        gitHandlerAbi = require('./abi/gitHandlerABI.json');
        return gitHandlerContract = new web3.eth.Contract(gitHandlerAbi, gitHandlerAddr);
      }).then(function() {
        var solutionAcceptedEvent;
        solutionAcceptedEvent = tasksHandlerContract.events.TaskSolutionAccepted();
        return solutionAcceptedEvent.on('data', function(event) {
          var patchIPFSHash;
          patchIPFSHash = hexToStr(event.returnValues.patchIPFSHash);
          return gitHandlerContract.methods.getCurrentIPFSHash().call().then(function(result) {
            var masterIPFSHash, masterPath;
            masterIPFSHash = hexToStr(result);
            masterPath = "./tmp/" + masterIPFSHash + "/";
            if (!fs.existsSync(masterPath)) {
              if (!fs.existsSync('./tmp')) {
                fs.mkdirSync('./tmp');
              }
              fs.mkdirSync(masterPath);
            }
            return git.clone("git@gateway.ipfs.io/ipfs/" + masterIPFSHash.toString(), masterPath, Number.POSITIVE_INFINITY, "master", function(error, _repo) {
              var repo;
              if (error !== null) {
                throw error;
              }
              repo = _repo;
              return repo.remote_add("solution", "gateway.ipfs.io/ipfs/" + patchIPFSHash, (function(_this) {
                return function(error) {
                  if (error !== null) {
                    throw error;
                  }
                  return repo.pull("solution", "master", function(error) {
                    if (error !== null) {
                      throw error;
                    }
                    return ipfs.util.addFromFs(masterPath, {
                      recursive: true
                    }, function(error, result) {
                      var entry, j, len, results;
                      if (error !== null) {
                        throw error;
                      }
                      results = [];
                      for (j = 0, len = result.length; j < len; j++) {
                        entry = result[j];
                        if (entry.path === masterIPFSHash) {
                          gitHandlerContract.methods.commitTaskSolutionToRepo(event.returnValues.taskId, event.returnValues.solId, entry.hash).send();
                          break;
                        } else {
                          results.push(void 0);
                        }
                      }
                      return results;
                    });
                  });
                };
              })(this));
            });
          });
        });
      });
    };
  })(this));

}).call(this);

//# sourceMappingURL=git-ipfs.js.map
