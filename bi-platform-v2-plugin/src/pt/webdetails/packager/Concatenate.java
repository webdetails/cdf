/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

package pt.webdetails.packager;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.InputStream;
import java.io.SequenceInputStream;
import java.util.Enumeration;
import java.util.NoSuchElementException;

import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;


/**
 *
 * @author pdpi
 */
class Concatenate {
  private static final Log logger = LogFactory.getLog(Concatenate.class);

  public static InputStream concat(File[] files) {
    ListOfFiles mylist = new ListOfFiles(files);

    return new SequenceInputStream(mylist);
  }

  public static InputStream concat(File[] files, String rootpath) {
    if (rootpath == null || StringUtils.isEmpty(rootpath)) {
      return concat(files);
    }
    BufferedReader fr = null;
    try {
      StringBuffer buffer = new StringBuffer();
      for (File file : files) {
        try {
        StringBuffer tmp = new StringBuffer();
        fr = new BufferedReader(new FileReader(file));
        while (fr.ready()) {
          tmp.append(fr.readLine());
        }
        rootpath = rootpath.replaceAll("\\\\","/").replaceAll("/+","/");
        String fileLocation = file.getPath().replaceAll("\\\\","/").replaceAll(file.getName(), "").replaceAll(rootpath, "..");
        buffer.append(tmp.toString() //
                // We need to replace all the URL formats
                .replaceAll("(url\\(['\"]?)", "$1" + fileLocation) // Standard URLs
                .replaceAll("(progid:DXImageTransform.Microsoft.AlphaImageLoader\\(src=')", "$1" + fileLocation + "../")); // these are IE-Only
        }
        catch (FileNotFoundException e) {
          logger.error("concat: File " + file.getAbsolutePath()
              + " doesn't exist! Skipping...");
        }
        catch (Exception e) {
          logger.error("concat: Error while attempting to concatenate file "
              + file.getAbsolutePath() + ". Attempting to continue", e);
        }
        finally {
          IOUtils.closeQuietly(fr);
        }

      }
      return new ByteArrayInputStream(buffer.toString().getBytes("UTF8"));
    } catch (Exception e) {
      return null;
    }

  }
}

class ListOfFiles implements Enumeration<FileInputStream> {

  private File[] listOfFiles;
  private int current = 0;

  public ListOfFiles(File[] listOfFiles) {
    this.listOfFiles = listOfFiles;
  }

  public boolean hasMoreElements() {
    if (current < listOfFiles.length) {
      return true;
    } else {
      return false;
    }
  }

  public FileInputStream nextElement() {
    FileInputStream in = null;

    if (!hasMoreElements()) {
      throw new NoSuchElementException("No more files.");
    } else {
      File nextElement = listOfFiles[current];
      current++;
      try {
        in = new FileInputStream(nextElement);
      } catch (FileNotFoundException e) {
        System.err.println("ListOfFiles: Can't open " + nextElement);
      }
    }
    return in;
  }
}
