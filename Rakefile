desc "Build a minified version of the plugin for the current version"
task :default do
  version   = File.read "VERSION"
  latest    = "releases/jquery.sexypost-#{version}.min.js"
  copyright = <<-EOS
  /*!
   * jQuery.sexyPost v#{version}
   * http://github.com/jurisgalang/jquery-sexypost
   *
   * Copyright 2010 - #{Time.now.year}, Juris Galang
   * Dual licensed under the MIT or GPL Version 2 licenses.
   *
   * Date: #{Time.now}
   */
  EOS
  copyright.gsub!(/^  /, "")
  File.open(latest, "w"){ |f| f.print copyright }
  sh "bin/jsmin < jquery.sexypost.js >> #{latest}"
  #sh "ln -s #{latest} sample-app/public/javascripts/jquery.sexypost-latest.js"
end
