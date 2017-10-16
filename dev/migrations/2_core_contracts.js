// Generated by CoffeeScript 1.12.7

/*
  2_core_contracts.coffee
  Created by Zefram Lou (Zebang Liu) as part of the WikiGit project.

  This file defines the deployment process of the core contracts of
  the DASP. In addition, it initializes the DASP's Git repo,
  publishes it onto the IPFS network, and saves its hash in the
  GitHandler module.
 */

(function() {
  var dao, fs, git, git_handler, ipfs, ipfsAPI, main, member_handler, tasks_handler, vault;

  main = artifacts.require('Main');

  dao = artifacts.require('Dao');

  member_handler = artifacts.require('MemberHandler');

  vault = artifacts.require('Vault');

  tasks_handler = artifacts.require('TasksHandler');

  git_handler = artifacts.require('GitHandler');

  ipfsAPI = require('ipfs-api');

  ipfs = ipfsAPI('localhost', '5001', {
    protocol: 'http'
  });

  git = require('gift');

  fs = require('fs');

  module.exports = (function(_this) {
    return function(deployer) {
      return deployer.deploy(main, 'Test Metadata').then(function() {
        var newHash, repoPath;
        repoPath = './tmp/init_repo';
        if (!fs.existsSync(repoPath)) {
          if (!fs.existsSync('./tmp')) {
            fs.mkdirSync('./tmp');
          }
          fs.mkdirSync(repoPath);
        }
        newHash = '';
        return git.init(repoPath, function(err, _repo) {
          return ipfs.util.addFromFs(repoPath, {
            recursive: true
          }, (function(_this) {
            return function(error, result) {
              var entry, i, len;
              if (error !== null) {
                throw error;
              } else {
                for (i = 0, len = result.length; i < len; i++) {
                  entry = result[i];
                  if (entry.path === 'repo') {
                    newHash = entry.hash;
                    break;
                  }
                }
                return deployer.deploy([[dao, main.address], [member_handler, 'Test Username', main.address], [vault, main.address], [tasks_handler, main.address], [git_handler, main.address, newHash]]).then(function() {
                  return main.deployed().then(function(instance) {
                    return instance.initializeModuleAddresses([dao.address, member_handler.address, vault.address, tasks_handler.address, git_handler.address]);
                  });
                }).then(function() {
                  return dao.deployed().then(function(instance) {
                    return instance.init();
                  });
                });
              }
            };
          })(this));
        });
      });
    };
  })(this);

}).call(this);

//# sourceMappingURL=2_core_contracts.js.map
